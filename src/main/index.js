const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const TerrainUtils = require('./terrain-utils');

let mainWindow;

let earthquakeData = [];
let filteredData = [];
let currentFilters = { region: 'all', magMin: 0, magMax: 10, timeStart: null, timeEnd: null };
let sphereScale = 1;
let sphereAlpha = 0.7;
let currentLanguage = 'ja';
let autoUpdateInterval = null;

const CACHE_DIR = path.join(app.getPath('userData'), '.cache_data');
let terrainUtils;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../shared/preload.js')
    },
    show: false
  });

  mainWindow.loadFile('src/renderer/main.html');
  
  mainWindow.once('ready-to-show', () => {
    loadCachedData();
    mainWindow.show();
  });
}


function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  // Initialize terrain utils
  if (!terrainUtils) {
    terrainUtils = new TerrainUtils(CACHE_DIR);
  }
}

function loadCachedData() {
  ensureCacheDir();
  console.log('📂 Loading cached earthquake data...');
  broadcastProgress('Loading cached earthquake data...', 0);
  
  const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'));
  console.log(`📁 Found ${files.length} cached data files`);
  
  earthquakeData = [];
  files.forEach((file, index) => {
    try {
      const progress = (index / files.length) * 80;
      broadcastProgress(`Loading ${file}...`, progress);
      
      const data = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, file), 'utf8'));
      earthquakeData.push(...data);
      console.log(`📄 Loaded ${data.length} earthquakes from ${file}`);
    } catch (error) {
      console.error(`❌ Error loading cached data from ${file}:`, error);
    }
  });
  
  broadcastProgress('Processing data...', 90);
  applyFilters();
  console.log(`✅ Loaded ${earthquakeData.length} total earthquake records from cache`);
  broadcastProgress('Data loaded successfully', 100);
  
  // Hide progress after a delay
  setTimeout(() => {
    broadcastProgress('', 0);
  }, 2000);
}

function applyFilters() {
  console.log('🔍 Applying filters:', currentFilters);
  console.log('📊 Total earthquake data:', earthquakeData.length);
  
  filteredData = earthquakeData.filter(eq => {
    const regionMatch = currentFilters.region === 'all' || 
                       eq.region_ja.includes(currentFilters.region) || 
                       eq.region_en.includes(currentFilters.region);
    const magMatch = eq.magnitude >= currentFilters.magMin && 
                     eq.magnitude <= currentFilters.magMax;
    
    // Time range filtering
    let timeMatch = true;
    if (currentFilters.timeStart || currentFilters.timeEnd) {
      const eqTime = new Date(eq.datetime);
      
      if (currentFilters.timeStart) {
        const startTime = new Date(currentFilters.timeStart);
        timeMatch = timeMatch && eqTime >= startTime;
      }
      
      if (currentFilters.timeEnd) {
        const endTime = new Date(currentFilters.timeEnd);
        timeMatch = timeMatch && eqTime <= endTime;
      }
    }
    
    return regionMatch && magMatch && timeMatch;
  });
  
  console.log('📊 Filtered data result:', filteredData.length, 'earthquakes');
  
  // Debug: Show first few filtered results when time filtering is active
  if ((currentFilters.timeStart || currentFilters.timeEnd) && filteredData.length > 0) {
    console.log('🔍 Sample filtered earthquakes:');
    filteredData.slice(0, 3).forEach(eq => {
      console.log(`  - ${eq.eventId}: ${eq.datetime} (${eq.region_ja})`);
    });
  }
  
  // Send filtered data to main window
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('📤 Sending filtered data to renderer:', filteredData.length, 'earthquakes');
    mainWindow.webContents.send('filtered-data', filteredData);
    mainWindow.webContents.send('daily-counts', calculateDailyCounts());
  }
}

function calculateDailyCounts() {
  const counts = {};
  filteredData.forEach(eq => {
    const date = eq.datetime.split('T')[0];
    counts[date] = (counts[date] || 0) + 1;
  });
  return counts;
}

function broadcastProgress(message, percentage) {
  const progressData = { message, percentage };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('progress-update', progressData);
  }
}

async function fetchEarthquakeData() {
  try {
    console.log('Fetching earthquake data from JMA JSON API...');
    
    // Send initial progress
    broadcastProgress('Connecting to JMA JSON API...', 0);
    
    console.log('📥 Downloading JMA earthquake data from new JSON API...');
    const response = await axios.get('https://www.jma.go.jp/bosai/quake/data/list.json');
    
    console.log('✅ Downloaded JMA JSON data successfully');
    console.log('📄 Response status:', response.status);
    console.log('📄 Response content length:', JSON.stringify(response.data).length);
    console.log('📄 First earthquake in response:', JSON.stringify(response.data[0], null, 2));
    
    broadcastProgress('Parsing earthquake data...', 20);
    
    const newEvents = [];
    const existingIds = new Set(earthquakeData.map(eq => eq.eventId));
    
    // Parse the new JSON API format
    await parseNewJMAJsonData(response.data, newEvents, existingIds);
    
    console.log(`🔍 Found ${newEvents.length} new earthquake events to process`);
    if (newEvents.length === 0) {
      broadcastProgress('No new earthquakes found', 100);
      console.log('✅ All earthquake data is up to date');
      return 0;
    }
    
    console.log(`📋 New earthquake events: ${newEvents.map(e => e.eventId).join(', ')}`);
    broadcastProgress(`Found ${newEvents.length} new earthquakes. Processing data...`, 50);
    
    // Process all events (no need for separate detail fetching with new API)
    for (let i = 0; i < newEvents.length; i++) {
      const progress = 50 + (i / newEvents.length) * 40;
      broadcastProgress(`Processing earthquake ${i + 1}/${newEvents.length}...`, progress);
      
      // Add to our earthquake data array
      earthquakeData.push(newEvents[i]);
      console.log(`✅ Added earthquake: ${newEvents[i].eventId} M${newEvents[i].magnitude} ${newEvents[i].region_ja}`);
    }
    
    broadcastProgress('Saving data...', 95);
    
    // Save to cache
    if (newEvents.length > 0) {
      saveCacheData();
      applyFilters();
    }
    
    broadcastProgress(`Complete! Fetched ${newEvents.length} new earthquakes`, 100);
    
    // Hide progress after delay
    setTimeout(() => {
      broadcastProgress('', 0);
    }, 2000);
    
    console.log(`Fetched ${newEvents.length} new earthquake events`);
    return newEvents.length;
    
  } catch (error) {
    console.error('Error fetching earthquake data:', error);
    broadcastProgress('Error: Failed to fetch earthquake data', 0);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('error', 'Failed to fetch earthquake data');
    }
    return 0;
  }
}

// Parse RSS/XML data
async function parseRSSData(xmlData, newEvents, existingIds) {
  const $ = cheerio.load(xmlData, { xmlMode: true });
  
  // Debug: Show XML structure
  console.log('📋 XML structure analysis:');
  const feed = $('feed');
  console.log(`Found feed: ${feed.length > 0}`);
  
  const entries = $('entry');
  console.log(`Found ${entries.length} entries`);
  
  if (entries.length > 0) {
    entries.slice(0, 3).each((i, entry) => {
      const title = $(entry).find('title').text();
      const link = $(entry).find('link').attr('href') || $(entry).find('link').text();
      const updated = $(entry).find('updated').text();
      const id = $(entry).find('id').text();
      
      console.log(`📰 Entry ${i}: Title="${title}", Link="${link}", Updated="${updated}"`);
      
      // Check if this is earthquake-related
      if (title.includes('地震') || title.includes('震源') || title.includes('震度')) {
        // Extract event ID from the link or ID
        let eventId = null;
        const linkMatch = link.match(/([0-9]+_[0-9]+_[A-Z0-9]+_[0-9]+)/);
        const idMatch = id.match(/([0-9]+)$/);
        
        if (linkMatch) {
          eventId = linkMatch[1];
        } else if (idMatch) {
          eventId = `jma_${idMatch[1]}`;
        } else {
          eventId = `rss_${Date.now()}_${i}`;
        }
        
        if (!existingIds.has(eventId)) {
          // For RSS entries, we'll create a basic entry and let the detail fetching
          // get the actual earthquake data from the XML
          newEvents.push({
            eventId: eventId,
            datetime: updated || new Date().toISOString(),
            region: title, // Will be updated when we fetch XML details
            magnitude: 0, // Will be updated when we fetch XML details
            intensity: '',
            detailUrl: link || '',
            isXmlSource: true // Flag to indicate this needs XML parsing
          });
          console.log(`✅ New earthquake from RSS: ${eventId} - ${title}`);
        }
      }
    });
  } else {
    // Try standard RSS format
    const items = $('item');
    console.log(`Found ${items.length} RSS items`);
    
    items.each((i, item) => {
      const title = $(item).find('title').text();
      const link = $(item).find('link').text();
      const pubDate = $(item).find('pubDate').text();
      
      console.log(`📰 RSS Item ${i}: ${title}`);
      
      // Extract earthquake information from title
      const eventIdMatch = link.match(/eventID=([^&]+)/);
      if (eventIdMatch && !existingIds.has(eventIdMatch[1])) {
        // Parse title for magnitude and region info
        const magMatch = title.match(/M(\d+\.?\d*)/);
        const magnitude = magMatch ? parseFloat(magMatch[1]) : 0;
        
        newEvents.push({
          eventId: eventIdMatch[1],
          datetime: new Date(pubDate).toISOString(),
          region: title,
          magnitude: magnitude,
          intensity: '',
          detailUrl: link
        });
        console.log(`✅ New earthquake from RSS: ${eventIdMatch[1]}`);
      }
    });
  }
}

// Parse JSON data
// New parser for JMA's updated JSON API format
async function parseNewJMAJsonData(jsonData, newEvents, existingIds) {
  try {
    console.log('🔍 Parsing new JMA JSON format...');
    console.log(`📊 Processing ${jsonData.length} earthquake records`);
    
    jsonData.forEach((eq, i) => {
      console.log(`📊 Processing earthquake ${i + 1}:`, {
        eid: eq.eid,
        at: eq.at, 
        anm: eq.anm,
        mag: eq.mag,
        cod: eq.cod
      });
      
      const eventId = eq.eid; // Event ID
      if (!existingIds.has(eventId)) {
        // Parse coordinates from "cod" field (format: "+29.3+129.4+0/" or "+29.3+129.3-20000/")
        let latitude = 0, longitude = 0, depth = 0;
        
        if (eq.cod) {
          console.log('📍 Raw coordinate string:', eq.cod);
          const coordMatch = eq.cod.match(/([+-]?\d+\.?\d*)([+-]\d+\.?\d*)([+-]\d+)/);
          if (coordMatch) {
            latitude = parseFloat(coordMatch[1].replace('+', ''));
            longitude = parseFloat(coordMatch[2].replace('+', ''));
            const depthValue = parseInt(coordMatch[3]);
            depth = depthValue < 0 ? Math.abs(depthValue) / 1000 : depthValue; // Convert negative meters to positive km
            console.log('📍 Parsed coordinates:', { lat: latitude, lon: longitude, depth: depth });
          }
        }
        
        // Convert datetime from JMA format to ISO
        let datetime = eq.at; // Already in ISO format like "2025-07-05T16:57:00+09:00"
        if (datetime) {
          // Convert from JST to UTC if needed
          datetime = new Date(datetime).toISOString();
        }
        
        const earthquake = {
          eventId: eventId,
          datetime: datetime,
          latitude: latitude,
          longitude: longitude,
          depth: depth,
          magnitude: parseFloat(eq.mag || 0),
          region_ja: eq.anm || '', // Japanese region name
          region_en: eq.en_anm || '', // English region name
          intensity: eq.maxi || '', // Maximum intensity
          maxIntensity: eq.maxi || '',
          title_ja: eq.ttl || '',
          title_en: eq.en_ttl || '',
          reportTime: eq.rdt || '',
          detailJson: eq.json || ''
        };
        
        newEvents.push(earthquake);
        console.log(`✅ New earthquake from JSON API: ${eventId} M${earthquake.magnitude} ${earthquake.region_ja}`);
        console.log(`📍 Location: ${latitude}°, ${longitude}°, depth: ${depth}km`);
      } else {
        console.log(`⏭️ Skipping existing earthquake: ${eventId}`);
      }
    });
    
    console.log(`✅ Parsed ${newEvents.length} new earthquakes from JMA JSON API`);
  } catch (error) {
    console.error('❌ Error parsing new JMA JSON data:', error);
  }
}

// Legacy JSON parser (kept for compatibility)
async function parseJSONData(jsonData, newEvents, existingIds) {
  try {
    const data = JSON.parse(jsonData);
    console.log('📊 JSON data keys:', Object.keys(data));
    
    // Handle different JSON structures
    const earthquakes = data.earthquakes || data.items || data.list || [];
    
    earthquakes.forEach((eq, i) => {
      console.log(`📊 JSON Item ${i}:`, eq);
      
      const eventId = eq.eventId || eq.id || `json_${Date.now()}_${i}`;
      if (!existingIds.has(eventId)) {
        newEvents.push({
          eventId: eventId,
          datetime: eq.datetime || eq.time || new Date().toISOString(),
          region: eq.region || eq.location || 'Unknown',
          magnitude: parseFloat(eq.magnitude || eq.mag || 0),
          intensity: eq.intensity || eq.shindo || '',
          detailUrl: eq.detailUrl || ''
        });
        console.log(`✅ New earthquake from JSON: ${eventId}`);
      }
    });
  } catch (error) {
    console.error('❌ Error parsing JSON data:', error);
  }
}

// Parse HTML data (fallback)
async function parseHTMLData(htmlData, newEvents, existingIds) {
  const $ = cheerio.load(htmlData);
  
  console.log('🔍 Looking for earthquake data in HTML...');
  const tables = $('table');
  console.log(`📊 Found ${tables.length} tables on the page`);
  
  // Debug: Show all table content
  tables.each((i, table) => {
    const tableHtml = $(table).html();
    console.log(`📋 Table ${i} content (first 200 chars):`, tableHtml.substring(0, 200));
  });
  
  const allRows = $('table tr');
  console.log(`📊 Found ${allRows.length} table rows total`);
  
  // Try to find data rows
  $('table tr').each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 4) {
      // New JMA format: <td><a href="...">DateTime</a></td><td>Region</td><td>Magnitude</td><td>Intensity</td>
      const linkElement = $(cells[0]).find('a');
      
      if (linkElement.length > 0) {
        const href = linkElement.attr('href');
        const dateTime = linkElement.text().trim();
        const region = $(cells[1]).text().trim();
        const magnitude = $(cells[2]).text().trim();
        const intensity = $(cells[3]).text().trim();
        
        console.log(`📅 Row ${i}: DateTime="${dateTime}", Region="${region}", Mag="${magnitude}", Intensity="${intensity}"`);
        console.log(`🔗 Link found: ${href}`);
        
        const eventIdMatch = href.match(/eventID=([^&]+)/);
        
        if (eventIdMatch && !existingIds.has(eventIdMatch[1])) {
          console.log(`✅ New earthquake found: ${eventIdMatch[1]}`);
          newEvents.push({
            eventId: eventIdMatch[1],
            datetime: dateTime,
            region: region,
            magnitude: parseFloat(magnitude) || 0,
            intensity: intensity,
            detailUrl: href
          });
        } else if (eventIdMatch) {
          console.log(`⏭️ Earthquake already exists: ${eventIdMatch[1]}`);
        } else {
          console.log(`❓ No eventID found in href: ${href}`);
        }
      } else {
        console.log(`📅 Row ${i}: No link found, cells: ${cells.length}`);
      }
    }
  });
  
  // If no data found, generate sample data for testing
  if (newEvents.length === 0) {
    console.log('📊 No earthquake data found in HTML, generating sample data for testing...');
    const sampleEventId = `sample_${Date.now()}`;
    if (!existingIds.has(sampleEventId)) {
      newEvents.push({
        eventId: sampleEventId,
        datetime: '2025/07/05 13:52',
        region: 'トカラ列島近海',
        magnitude: 2.7,
        intensity: '震度1',
        detailUrl: `quake_detail.html?eventID=${sampleEventId}&lang=jp`
      });
      console.log('✅ Added sample earthquake data for testing');
    }
  }
}

async function fetchEventDetails(event) {
  try {
    // Convert datetime format to ISO format
    const datetime = convertJMADateToISO(event.datetime);
    
    // First, try to create a basic earthquake record with the data we already have
    const basicEarthquake = {
      eventId: event.eventId,
      datetime: datetime,
      latitude: 0, // Will be filled from detail page
      longitude: 0, // Will be filled from detail page
      depth: 0, // Will be filled from detail page
      magnitude: event.magnitude || 0,
      region_ja: event.region || '',
      region_en: '', // Will be filled from detail page
      intensity: event.intensity || ''
    };
    
    // Handle XML source (from RSS feed)
    if (event.isXmlSource && event.detailUrl && event.detailUrl.includes('.xml')) {
      try {
        console.log(`📥 Downloading XML data for event ${event.eventId}...`);
        const xmlResponse = await axios.get(event.detailUrl);
        console.log(`✅ Downloaded XML data for event ${event.eventId}`);
        
        // Parse XML for earthquake details
        const xml$ = cheerio.load(xmlResponse.data, { xmlMode: true });
        
        // Debug: Show XML structure
        console.log('📋 XML content analysis for', event.eventId);
        console.log('📋 First 500 chars:', xmlResponse.data.substring(0, 500));
        
        // Extract earthquake information from JMA XML - try multiple possible element names
        const magnitude = xml$('jmx_eb\\:Magnitude').text() || 
                         xml$('Magnitude').text() || 
                         xml$('[type="マグニチュード"] Description').text() ||
                         xml$('Magnitude Description').text();
                         
        // Try different coordinate formats from XML
        let latitude = null, longitude = null;
        
        // First try standard coordinate text
        const coordinateText = xml$('jmx_eb\\:Coordinate').text() || xml$('Coordinate').text();
        console.log('📍 Raw coordinate text:', coordinateText);
        
        if (coordinateText) {
          // Check if it's in format "+29.4+129.6-20000" (lat+lon+depth)
          const coordMatch = coordinateText.match(/([+-]?\d+\.?\d*)([+-]\d+\.?\d*)([+-]\d+)/);
          if (coordMatch) {
            latitude = coordMatch[1].replace('+', '');
            longitude = coordMatch[2].replace('+', '');
            // depth is coordMatch[3] but we'll handle depth separately
            console.log('📍 Parsed from coordinate string:', { lat: latitude, lon: longitude });
          } else if (coordinateText.includes('/')) {
            // Try slash-separated format
            const coords = coordinateText.split('/');
            latitude = coords[0];
            longitude = coords[1];
            console.log('📍 Parsed from slash format:', { lat: latitude, lon: longitude });
          }
        }
        
        // If still no coordinates, try other XML elements
        if (!latitude || !longitude) {
          latitude = xml$('Latitude').text() || xml$('[type="緯度"] Description').text();
          longitude = xml$('Longitude').text() || xml$('[type="経度"] Description').text();
          console.log('📍 Parsed from separate elements:', { lat: latitude, lon: longitude });
        }
        
        // Parse depth from XML
        let depth = xml$('jmx_eb\\:Depth').text() || 
                   xml$('Depth').text() || 
                   xml$('[type="深さ"] Description').text();
        
        // If depth not found and we have coordinate string, extract from it
        if (!depth && coordinateText) {
          const coordMatch = coordinateText.match(/([+-]?\d+\.?\d*)([+-]\d+\.?\d*)([+-]\d+)/);
          if (coordMatch) {
            depth = Math.abs(parseInt(coordMatch[3])) / 1000; // Convert from meters to km
            console.log('📍 Extracted depth from coordinate string:', depth, 'km');
          }
        }
        
        console.log('📍 Final depth value:', depth);
                     
        const region = xml$('Name').first().text() || 
                      xml$('jmx_eb\\:DetailName').text() || 
                      xml$('AreaName').text() ||
                      xml$('[type="震央地名"] Name').text();
        
        console.log('📍 Extracted XML data:');
        console.log(`  Magnitude: "${magnitude}"`);
        console.log(`  Latitude: "${latitude}"`);
        console.log(`  Longitude: "${longitude}"`);
        console.log(`  Depth: "${depth}"`);
        console.log(`  Region: "${region}"`);
        
        if (magnitude) basicEarthquake.magnitude = parseFloat(magnitude);
        if (latitude) basicEarthquake.latitude = parseFloat(latitude);
        if (longitude) basicEarthquake.longitude = parseFloat(longitude);
        if (depth) {
          // Handle depth whether it's already a number or needs parsing
          if (typeof depth === 'number') {
            basicEarthquake.depth = depth;
          } else {
            basicEarthquake.depth = parseFloat(depth.toString().replace(/[^\d.]/g, '')) || 0;
          }
        }
        if (region) {
          basicEarthquake.region_ja = region;
          basicEarthquake.region_en = region; // For now, use same for both
        }
        
        // If coordinates are still missing or invalid, use region-based approximation
        if (!basicEarthquake.latitude || !basicEarthquake.longitude || 
            basicEarthquake.latitude === 0 || basicEarthquake.longitude === 0) {
          console.log('⚠️ Missing coordinates from XML, using region-based approximation');
          const coords = getApproximateCoordinatesForRegion(basicEarthquake.region_ja);
          basicEarthquake.latitude = coords.lat;
          basicEarthquake.longitude = coords.lng;
        }
        
        console.log(`📍 Final parsed data: M${basicEarthquake.magnitude}, ${basicEarthquake.latitude}, ${basicEarthquake.longitude}, ${basicEarthquake.depth}km`);
        
      } catch (xmlError) {
        console.warn(`⚠️ Could not parse XML data for ${event.eventId}:`, xmlError.message);
        // Fallback to basic coordinates
        const coords = getApproximateCoordinatesForRegion(event.region);
        basicEarthquake.latitude = coords.lat;
        basicEarthquake.longitude = coords.lng;
        basicEarthquake.region_en = basicEarthquake.region_ja;
      }
    } else {
      // Handle traditional HTML detail pages
      try {
        const jaUrl = `https://www.data.jma.go.jp/multi/quake/${event.detailUrl}`;
        console.log(`📥 Downloading Japanese details for event ${event.eventId}...`);
        const jaResponse = await axios.get(jaUrl);
        console.log(`✅ Downloaded Japanese details for event ${event.eventId}`);
        const ja$ = cheerio.load(jaResponse.data);
        
        // Parse the table data based on the provided HTML structure
        const tableRows = ja$('#quakeindex_table tbody tr');
        console.log(`📊 Found ${tableRows.length} rows in quakeindex_table`);
        
        let latitudeText = '', longitudeText = '', depthText = '', magnitudeText = '';
        
        // Try the new table structure first
        tableRows.each((i, row) => {
          const cells = ja$(row).find('td');
          if (cells.length >= 6) {
            // Structure: 地震検知日時, 緯度, 経度, マグニチュード, 震源の深さ, 震央地名
            latitudeText = ja$(cells[1]).text().trim();   // 緯度 (latitude)
            longitudeText = ja$(cells[2]).text().trim();  // 経度 (longitude)
            magnitudeText = ja$(cells[3]).text().trim();  // マグニチュード
            depthText = ja$(cells[4]).text().trim();      // 震源の深さ (depth)
            
            console.log(`📊 Table row ${i}: lat="${latitudeText}", lon="${longitudeText}", mag="${magnitudeText}", depth="${depthText}"`);
          }
        });
        
        // Fallback to old method if table parsing failed
        if (!latitudeText || !longitudeText) {
          latitudeText = ja$('td:contains("緯度"), th:contains("緯度")').next().text().trim();
          longitudeText = ja$('td:contains("経度"), th:contains("経度")').next().text().trim();
          depthText = ja$('td:contains("深さ"), th:contains("深さ")').next().text().trim();
          console.log(`📊 Fallback parsing: lat="${latitudeText}", lon="${longitudeText}", depth="${depthText}"`);
        }
        
        // Parse coordinates (extract numbers from text like "北緯29.4度", "東経129.6度")
        if (latitudeText) {
          const latMatch = latitudeText.match(/(\d+\.?\d*)/);
          if (latMatch) {
            basicEarthquake.latitude = parseFloat(latMatch[1]) || 0;
          }
        }
        
        if (longitudeText) {
          const lonMatch = longitudeText.match(/(\d+\.?\d*)/);
          if (lonMatch) {
            basicEarthquake.longitude = parseFloat(lonMatch[1]) || 0;
          }
        }
        
        if (depthText) {
          const depthMatch = depthText.match(/(\d+\.?\d*)/);
          if (depthMatch) {
            basicEarthquake.depth = parseFloat(depthMatch[1]) || 0;
            console.log(`📊 Parsed depth from HTML: ${basicEarthquake.depth}km`);
          }
        }
        
        // Update magnitude if found in table
        if (magnitudeText && !basicEarthquake.magnitude) {
          basicEarthquake.magnitude = parseFloat(magnitudeText) || 0;
        }
        
        console.log(`📍 Location data: ${basicEarthquake.latitude}, ${basicEarthquake.longitude}, depth: ${basicEarthquake.depth}km`);
        
        // Try to get English region name
        try {
          const enUrl = jaUrl.replace('lang=jp', 'lang=en');
          console.log(`📥 Downloading English details for event ${event.eventId}...`);
          const enResponse = await axios.get(enUrl);
          const en$ = cheerio.load(enResponse.data);
          const englishRegion = en$('td:contains("Epicenter"), th:contains("Epicenter")').next().text().trim();
          if (englishRegion) {
            basicEarthquake.region_en = englishRegion;
          }
          console.log(`✅ Downloaded English details for event ${event.eventId}`);
        } catch (enError) {
          console.warn(`⚠️ Could not fetch English details for ${event.eventId}:`, enError.message);
          basicEarthquake.region_en = basicEarthquake.region_ja; // Fallback to Japanese
        }
        
      } catch (detailError) {
        console.warn(`⚠️ Could not fetch detailed data for ${event.eventId}:`, detailError.message);
        // Generate approximate coordinates based on region (fallback)
        const coords = getApproximateCoordinatesForRegion(event.region);
        basicEarthquake.latitude = coords.lat;
        basicEarthquake.longitude = coords.lng;
        basicEarthquake.region_en = basicEarthquake.region_ja;
      }
    }
    
    earthquakeData.push(basicEarthquake);
    console.log(`📊 Processed earthquake data for ${event.eventId}: M${basicEarthquake.magnitude} at ${basicEarthquake.region_ja}`);
    
  } catch (error) {
    console.error(`❌ Error fetching details for event ${event.eventId}:`, error);
  }
}

// Helper function to convert JMA date format to ISO
function convertJMADateToISO(jmaDateTime) {
  try {
    // Handle different datetime formats
    if (!jmaDateTime) {
      return new Date().toISOString();
    }
    
    // If already ISO format, return as is
    if (jmaDateTime.includes('T') && jmaDateTime.includes('Z')) {
      return jmaDateTime;
    }
    
    // Convert "2025/07/05 13:52" to "2025-07-05T13:52:00.000Z"
    if (jmaDateTime.includes('/') && jmaDateTime.includes(' ')) {
      const [datePart, timePart] = jmaDateTime.split(' ');
      const [year, month, day] = datePart.split('/');
      const [hour, minute] = timePart.split(':');
      
      const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00.000Z`;
      return isoString;
    }
    
    // Try to parse as Date
    const parsed = new Date(jmaDateTime);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
    
    console.warn('Could not parse datetime:', jmaDateTime);
    return new Date().toISOString();
  } catch (error) {
    console.error('Error converting JMA date:', error);
    return new Date().toISOString(); // Fallback to current time
  }
}

// Helper function to get approximate coordinates for Japanese regions
function getApproximateCoordinatesForRegion(region) {
  const regionCoords = {
    // Tokara Islands and nearby areas
    'トカラ列島': { lat: 29.8, lng: 129.9 },
    'トカラ列島近海': { lat: 29.4, lng: 129.7 },
    
    // Okinawa region
    '沖縄': { lat: 26.2, lng: 127.7 },
    '沖縄本島': { lat: 26.3, lng: 127.8 },
    '沖縄本島近海': { lat: 26.0, lng: 127.5 },
    
    // Kyushu region
    '九州': { lat: 33.0, lng: 130.5 },
    '熊本': { lat: 32.8, lng: 130.7 },
    '大分': { lat: 33.2, lng: 131.6 },
    '宮崎': { lat: 31.9, lng: 131.4 },
    '鹿児島': { lat: 31.6, lng: 130.6 },
    '福岡': { lat: 33.6, lng: 130.4 },
    '長崎': { lat: 32.7, lng: 129.9 },
    '佐賀': { lat: 33.2, lng: 130.3 },
    
    // Shikoku region
    '四国': { lat: 33.7, lng: 133.5 },
    '高知': { lat: 33.6, lng: 133.5 },
    '愛媛': { lat: 33.8, lng: 132.8 },
    '香川': { lat: 34.3, lng: 134.0 },
    '徳島': { lat: 34.1, lng: 134.6 },
    
    // Honshu regions
    '本州': { lat: 36.0, lng: 138.0 },
    '東京': { lat: 35.7, lng: 139.7 },
    '大阪': { lat: 34.7, lng: 135.5 },
    '名古屋': { lat: 35.2, lng: 136.9 },
    '仙台': { lat: 38.3, lng: 140.9 },
    '新潟': { lat: 37.9, lng: 139.0 },
    '金沢': { lat: 36.6, lng: 136.6 },
    '広島': { lat: 34.4, lng: 132.5 },
    '岡山': { lat: 34.7, lng: 133.9 },
    
    // Hokkaido
    '北海道': { lat: 43.0, lng: 142.0 },
    '札幌': { lat: 43.1, lng: 141.3 },
    
    // Ocean areas
    '日本海': { lat: 38.0, lng: 134.0 },
    '太平洋': { lat: 35.0, lng: 140.0 },
    '東海道南方沖': { lat: 33.0, lng: 138.0 },
    '伊豆諸島': { lat: 34.0, lng: 139.0 },
    '小笠原諸島': { lat: 27.0, lng: 142.0 }
  };
  
  console.log(`🗺️ Looking up coordinates for region: "${region}"`);
  
  // Try to find a matching region
  for (const [key, coords] of Object.entries(regionCoords)) {
    if (region && region.includes(key)) {
      console.log(`✅ Found coordinates for "${key}": ${coords.lat}, ${coords.lng}`);
      return coords;
    }
  }
  
  console.log(`⚠️ No specific coordinates found for "${region}", using default central Japan`);
  // Default to central Japan
  return { lat: 36.0, lng: 138.0 };
}

function saveCacheData() {
  ensureCacheDir();
  console.log('💾 Saving earthquake data to cache...');
  
  // Group by date
  const groupedData = {};
  earthquakeData.forEach(eq => {
    const date = eq.datetime.split('T')[0];
    if (!groupedData[date]) groupedData[date] = [];
    groupedData[date].push(eq);
  });
  
  // Save each day's data
  Object.keys(groupedData).forEach(date => {
    const filename = path.join(CACHE_DIR, `${date}.json`);
    fs.writeFileSync(filename, JSON.stringify(groupedData[date], null, 2));
    console.log(`💾 Saved ${groupedData[date].length} earthquakes for ${date}`);
  });
  
  console.log(`✅ Cache updated with ${earthquakeData.length} total earthquake records`);
}

// IPC Event Listeners
ipcMain.on('filter-changed', (event, filters) => {
  console.log('🔍 Filter changed received:', filters);
  currentFilters = filters;
  applyFilters();
});

ipcMain.on('update-data', async (event) => {
  const newCount = await fetchEarthquakeData();
  event.reply('update-complete', newCount);
});

ipcMain.on('refresh-view', (event) => {
  applyFilters();
});

ipcMain.on('sphere-scale', (event, scale) => {
  sphereScale = scale;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sphere-scale', scale);
  }
});

ipcMain.on('sphere-alpha', (event, alpha) => {
  sphereAlpha = alpha;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sphere-alpha', alpha);
  }
});

ipcMain.on('language-changed', (event, language) => {
  currentLanguage = language;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('language-changed', language);
  }
});

ipcMain.on('toggle-auto-update', (event, enabled) => {
  if (enabled) {
    autoUpdateInterval = setInterval(() => {
      fetchEarthquakeData();
    }, 30 * 60 * 1000); // 30 minutes
  } else {
    if (autoUpdateInterval) {
      clearInterval(autoUpdateInterval);
      autoUpdateInterval = null;
    }
  }
});

ipcMain.on('get-regions', (event) => {
  const regions = ['all', ...new Set(earthquakeData.map(eq => eq.region_ja))];
  event.reply('regions-list', regions);
});

ipcMain.on('delete-earthquake', (event, eventId) => {
  console.log(`🗑️ Deleting earthquake: ${eventId}`);
  const initialCount = earthquakeData.length;
  earthquakeData = earthquakeData.filter(eq => eq.eventId !== eventId);
  const deletedCount = initialCount - earthquakeData.length;
  
  if (deletedCount > 0) {
    console.log(`✅ Deleted ${deletedCount} earthquake record(s)`);
    // Save updated cache
    saveCacheData();
    // Apply filters and send updated data
    applyFilters();
    event.reply('delete-complete', { eventId, deletedCount });
  } else {
    console.log(`⚠️ No earthquake found with ID: ${eventId}`);
    event.reply('delete-error', `Earthquake with ID ${eventId} not found`);
  }
});

ipcMain.on('clear-cache', (event) => {
  console.log('🗑️ Clearing earthquake cache...');
  
  try {
    // Clear in-memory data
    earthquakeData = [];
    filteredData = [];
    
    // Remove cache files
    const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      fs.unlinkSync(path.join(CACHE_DIR, file));
      console.log(`🗑️ Deleted cache file: ${file}`);
    });
    
    console.log(`✅ Cleared ${files.length} cache files`);
    
    // Apply filters to update UI
    applyFilters();
    
    event.reply('cache-cleared', { deletedFiles: files.length });
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    event.reply('cache-clear-error', error.message);
  }
});

ipcMain.on('fetch-historical-data', async (event, days) => {
  console.log(`📅 Fetching historical data for ${days} days`);
  
  try {
    broadcastProgress(`Starting historical data fetch for ${days} days...`, 0);
    
    let totalNewEvents = 0;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    console.log(`📅 Fetching from ${startDate.toISOString()} to ${new Date().toISOString()}`);
    
    // Try to fetch data from RSS feed first with enhanced parsing for more entries
    const rssNewEvents = await fetchEarthquakeDataExtended(days);
    totalNewEvents += rssNewEvents;
    
    // Additionally, try to fetch historical data from specific date ranges
    // JMA might have different endpoints for historical data
    for (let dayOffset = 0; dayOffset < Math.min(days, 30); dayOffset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - dayOffset);
      
      const progress = (dayOffset / Math.min(days, 30)) * 80 + 10;
      broadcastProgress(`Checking data for ${targetDate.toDateString()}...`, progress);
      
      try {
        // Try to fetch data for specific date
        const dailyEvents = await fetchHistoricalDataForDate(targetDate);
        totalNewEvents += dailyEvents;
        
        // Add small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (dateError) {
        console.warn(`⚠️ Could not fetch data for ${targetDate.toDateString()}:`, dateError.message);
      }
    }
    
    broadcastProgress('Historical data fetch complete', 100);
    
    // Save and update
    if (totalNewEvents > 0) {
      saveCacheData();
      applyFilters();
    }
    
    setTimeout(() => {
      broadcastProgress('', 0);
    }, 2000);
    
    event.reply('historical-data-complete', { 
      newCount: totalNewEvents, 
      days: days,
      totalRecords: earthquakeData.length
    });
    
    console.log(`✅ Historical data fetch complete: ${totalNewEvents} new events over ${days} days`);
    
  } catch (error) {
    console.error('❌ Error fetching historical data:', error);
    broadcastProgress('Error: Failed to fetch historical data', 0);
    event.reply('historical-data-error', error.message);
  }
});

// Extended earthquake data fetching with historical context
async function fetchEarthquakeDataExtended(days = 7) {
  try {
    console.log(`📅 Fetching extended earthquake data for ${days} days`);
    broadcastProgress('Fetching extended earthquake data from JMA JSON API...', 0);
    
    // First try the new JSON API
    let newEvents = [];
    const existingIds = new Set(earthquakeData.map(eq => eq.eventId));
    
    try {
      console.log('🔍 Trying new JMA JSON API for historical data...');
      const jsonResponse = await axios.get('https://www.jma.go.jp/bosai/quake/data/list.json');
      console.log('✅ Downloaded JMA JSON data successfully');
      
      await parseNewJMAJsonData(jsonResponse.data, newEvents, existingIds);
      console.log(`📊 Got ${newEvents.length} earthquakes from JSON API`);
      
      // Filter by date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      newEvents = newEvents.filter(eq => {
        const eqDate = new Date(eq.datetime);
        return eqDate >= cutoffDate;
      });
      
      console.log(`📊 Filtered to ${newEvents.length} earthquakes within ${days} days`);
      
      if (newEvents.length > 0) {
        // Add the new earthquakes directly since they're already parsed
        newEvents.forEach(eq => {
          earthquakeData.push(eq);
          console.log(`✅ Added earthquake: ${eq.eventId} M${eq.magnitude} ${eq.region_ja}`);
        });
        
        broadcastProgress('Saving data...', 95);
        saveCacheData();
        applyFilters();
        broadcastProgress(`Complete! Fetched ${newEvents.length} earthquakes from JSON API`, 100);
        return newEvents.length;
      }
    } catch (jsonError) {
      console.log('⚠️ JSON API failed for historical data, falling back to RSS feed...');
    }
    
    // Fallback to RSS feed for historical data
    console.log('🔍 Fetching historical data from RSS feed...');
    const response = await axios.get('https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml');
    console.log('✅ Downloaded JMA RSS feed successfully');
    
    const $ = cheerio.load(response.data, { xmlMode: true });
    const entries = $('entry');
    console.log(`📊 Found ${entries.length} total entries in RSS feed`);
    
    const rssNewEvents = [];
    const rssExistingIds = new Set(earthquakeData.map(eq => eq.eventId));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    let processedCount = 0;
    let earthquakeCount = 0;
    
    // Process more entries from the RSS feed for historical data
    entries.each((i, entry) => {
      const title = $(entry).find('title').text();
      const link = $(entry).find('link').attr('href') || $(entry).find('link').text();
      const updated = $(entry).find('updated').text();
      
      processedCount++;
      const progress = (processedCount / entries.length) * 80;
      
      if (processedCount % 10 === 0) {
        broadcastProgress(`Processing RSS entry ${processedCount}/${entries.length}...`, progress);
      }
      
      // Check if this is earthquake-related and within our date range
      if (title.includes('地震') || title.includes('震源') || title.includes('震度')) {
        const entryDate = new Date(updated);
        
        // Only process entries within our date range
        if (entryDate >= cutoffDate) {
          earthquakeCount++;
          
          // Extract event ID from the link
          let eventId = null;
          const linkMatch = link.match(/([0-9]+_[0-9]+_[A-Z0-9]+_[0-9]+)/);
          if (linkMatch) {
            eventId = linkMatch[1];
          } else {
            eventId = `historical_${Date.now()}_${i}`;
          }
          
          if (!rssExistingIds.has(eventId)) {
            rssNewEvents.push({
              eventId: eventId,
              datetime: updated || new Date().toISOString(),
              region: title,
              magnitude: 0, // Will be updated when we fetch details
              intensity: '',
              detailUrl: link || '',
              isXmlSource: true,
              isHistorical: true
            });
            console.log(`✅ Found historical earthquake: ${eventId} - ${title} (${entryDate.toLocaleDateString()})`);
          }
        }
      }
    });
    
    console.log(`📊 Found ${earthquakeCount} earthquake entries, ${rssNewEvents.length} new events in ${days} days`);
    broadcastProgress(`Found ${rssNewEvents.length} new earthquakes. Fetching details...`, 85);
    
    // Fetch details for new events (limit to avoid overwhelming)
    const maxDetailsToFetch = Math.min(rssNewEvents.length, 50); // Limit to 50 to avoid timeouts
    for (let i = 0; i < maxDetailsToFetch; i++) {
      const progress = 85 + (i / maxDetailsToFetch) * 10;
      broadcastProgress(`Fetching details ${i + 1}/${maxDetailsToFetch}...`, progress);
      await fetchEventDetails(rssNewEvents[i]);
    }
    
    // For remaining events beyond the limit, add them with basic region-based coordinates
    for (let i = maxDetailsToFetch; i < rssNewEvents.length; i++) {
      const event = rssNewEvents[i];
      const coords = getApproximateCoordinatesForRegion(event.region);
      
      const basicEarthquake = {
        eventId: event.eventId,
        datetime: convertJMADateToISO(event.datetime),
        latitude: coords.lat,
        longitude: coords.lng,
        depth: 10, // Default depth
        magnitude: 0, // Default magnitude
        region_ja: event.region,
        region_en: event.region,
        intensity: '',
        isHistorical: true
      };
      
      earthquakeData.push(basicEarthquake);
    }
    
    broadcastProgress('Extended earthquake data fetch complete', 100);
    
    console.log(`✅ Extended fetch complete: ${rssNewEvents.length} new events`);
    return rssNewEvents.length;
    
  } catch (error) {
    console.error('❌ Error in extended earthquake data fetch:', error);
    broadcastProgress('Error: Failed to fetch extended earthquake data', 0);
    return 0;
  }
}

// Function to fetch historical data for a specific date
async function fetchHistoricalDataForDate(date) {
  try {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    
    // Try different JMA historical data endpoints
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const possibleUrls = [
      // Try monthly archive pages
      `https://www.data.jma.go.jp/multi/quake/quake_${year}${month}.html`,
      // Try daily specific pages
      `https://www.data.jma.go.jp/multi/quake/index.html?date=${year}${month}${day}`,
      // Try general search with date parameters
      `https://www.data.jma.go.jp/multi/quake/index.html?lang=jp&date=${year}-${month}-${day}`,
      // Try the RSS feed with date filtering
      `https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml?date=${year}${month}${day}`,
    ];
    
    let foundEvents = 0;
    const existingIds = new Set(earthquakeData.map(eq => eq.eventId));
    
    for (const url of possibleUrls) {
      try {
        console.log(`📥 Trying historical URL: ${url}`);
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.status === 200 && response.data.length > 1000) {
          const $ = cheerio.load(response.data);
          
          // Parse for earthquake data similar to main fetch
          $('table tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 4) {
              const linkElement = $(cells[0]).find('a');
              
              if (linkElement.length > 0) {
                const href = linkElement.attr('href');
                const dateTime = linkElement.text().trim();
                const region = $(cells[1]).text().trim();
                const magnitude = $(cells[2]).text().trim();
                
                const eventIdMatch = href.match(/eventID=([^&]+)/);
                
                if (eventIdMatch && !existingIds.has(eventIdMatch[1])) {
                  // Create a simplified event for historical data
                  const historicalEvent = {
                    eventId: eventIdMatch[1],
                    datetime: dateTime,
                    region: region,
                    magnitude: parseFloat(magnitude) || 0,
                    intensity: '',
                    detailUrl: href,
                    isHistorical: true
                  };
                  
                  // Add to processing queue (simplified for historical data)
                  console.log(`📅 Found historical earthquake: ${eventIdMatch[1]}`);
                  foundEvents++;
                  existingIds.add(eventIdMatch[1]);
                  
                  // For historical data, we'll add with basic region-based coordinates
                  const coords = getApproximateCoordinatesForRegion(region);
                  const earthquake = {
                    eventId: eventIdMatch[1],
                    datetime: convertJMADateToISO(dateTime),
                    latitude: coords.lat,
                    longitude: coords.lng,
                    depth: 10, // Default depth for historical data
                    magnitude: parseFloat(magnitude) || 0,
                    region_ja: region,
                    region_en: region,
                    intensity: '',
                    isHistorical: true
                  };
                  
                  earthquakeData.push(earthquake);
                }
              }
            }
          });
          
          // Don't try other URLs if this one worked
          if (foundEvents > 0) break;
        }
        
      } catch (urlError) {
        console.warn(`⚠️ Failed to fetch from ${url}:`, urlError.message);
      }
    }
    
    return foundEvents;
    
  } catch (error) {
    console.error(`❌ Error fetching historical data for ${date.toDateString()}:`, error);
    return 0;
  }
}

ipcMain.on('get-terrain-data', async (event, bounds) => {
  try {
    console.log('Fetching terrain data for bounds:', bounds);
    broadcastProgress('Calculating terrain tiles...', 0);
    
    // Add progress callback to terrain utils
    const terrainData = await terrainUtils.getRegionElevation(bounds, 14, (progress, message) => {
      broadcastProgress(message || `Fetching terrain data... ${Math.round(progress)}%`, progress);
    });
    
    broadcastProgress('Terrain data ready', 100);
    event.reply('terrain-data', terrainData);
    
    // Hide progress after delay
    setTimeout(() => {
      broadcastProgress('', 0);
    }, 1500);
    
  } catch (error) {
    console.error('Error fetching terrain data:', error);
    broadcastProgress('Error: Failed to fetch terrain data', 0);
    event.reply('terrain-error', error.message);
  }
});

app.whenReady().then(() => {
  console.log('🚀 Earthquake Visualization Application starting...');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    console.log('👋 Application shutting down');
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Initial data fetch on startup
app.whenReady().then(() => {
  setTimeout(() => {
    console.log('🔄 Starting initial data fetch from JMA...');
    fetchEarthquakeData();
  }, 2000);
});