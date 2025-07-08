// Main application logic for the single-window interface
console.log('🚀 Main.js loaded successfully!');

let currentData = [];
let currentLanguage = 'ja';
let currentTab = 'overview';
let sphereScale = 1;
let sphereAlpha = 0.7;
let availableRegions = ['all'];

// Three.js variables
let scene, camera, renderer;
let earthquakeSpheres = [];
let terrainMesh = null;
let terrainData = null;

// Calendar variables
let currentDate = new Date();
let dailyCounts = {};

const monthNames = {
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};

// Initialize application
function initializeApp() {
  console.log('🔧 Starting app initialization...');
  
  try {
    console.log('📚 Initializing i18n...');
    initializeI18n();
    
    console.log('🏷️ Setting up tab navigation...');
    setupTabNavigation();
    
    console.log('🌐 Setting up language switch...');
    setupLanguageSwitch();
    
    console.log('🔍 Setting up filter controls...');
    setupFilterControls();
    
    console.log('🎛️ Setting up control panel...');
    setupControlPanelControls();
    
    console.log('📅 Setting up calendar controls...');
    setupCalendarControls();
    
    console.log('📡 Setting up IPC listeners...');
    setupIpcListeners();
    
    // Initialize 3D scene when visualization tab is first activated
    const vizTab = document.querySelector('[data-tab="visualization"]');
    if (vizTab) {
      vizTab.addEventListener('click', () => {
        if (!scene) {
          setTimeout(init3DScene, 100);
        }
      });
      console.log('🎨 3D scene initialization listener added');
    } else {
      console.error('❌ Could not find visualization tab button');
    }
    
    console.log('✅ App initialization complete!');
  } catch (error) {
    console.error('❌ Error during app initialization:', error);
    throw error;
  }
}

// Tab Navigation
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  console.log(`Found ${tabButtons.length} tab buttons`);
  console.log(`Found ${tabPanes.length} tab panes`);
  
  if (tabButtons.length === 0) {
    console.error('❌ No tab buttons found!');
    return;
  }
  
  tabButtons.forEach((button, index) => {
    const tabName = button.getAttribute('data-tab');
    console.log(`Setting up tab ${index}: ${tabName}`);
    
    button.addEventListener('click', (e) => {
      console.log(`🖱️ Tab clicked: ${tabName}`);
      e.preventDefault();
      
      const targetTab = button.getAttribute('data-tab');
      const targetPaneId = `${targetTab}-pane`;
      
      console.log(`Looking for pane: ${targetPaneId}`);
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab pane
      tabPanes.forEach(pane => pane.classList.remove('active'));
      const targetPane = document.getElementById(targetPaneId);
      
      if (targetPane) {
        targetPane.classList.add('active');
        console.log(`✅ Successfully switched to ${targetTab} tab`);
      } else {
        console.error(`❌ Could not find pane: ${targetPaneId}`);
      }
      
      currentTab = targetTab;
      
      // Handle tab-specific initialization
      if (targetTab === 'visualization' && !scene) {
        setTimeout(init3DScene, 100);
      } else if (targetTab === 'calendar') {
        updateCalendar();
      }
    });
  });
}

// Language Switch
function setupLanguageSwitch() {
  const langButtons = document.querySelectorAll('.lang-btn');
  
  langButtons.forEach(button => {
    button.addEventListener('click', () => {
      const language = button.getAttribute('data-language');
      
      // Update active button
      langButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Send language change to main process
      window.api.send('language-changed', language);
    });
  });
}

// Filter Controls
function setupFilterControls() {
  const regionSelect = document.getElementById('regionSelect');
  const magMin = document.getElementById('magMin');
  const magMax = document.getElementById('magMax');
  const timeStart = document.getElementById('timeStart');
  const timeEnd = document.getElementById('timeEnd');
  const applyBtn = document.getElementById('applyBtn');
  const resetBtn = document.getElementById('resetBtn');
  
  function updateRangeDisplay() {
    const minVal = parseFloat(magMin.value);
    const maxVal = parseFloat(magMax.value);
    document.getElementById('rangeDisplay').textContent = `${minVal.toFixed(1)} - ${maxVal.toFixed(1)}`;
  }
  
  function updateTimeRangeDisplay() {
    if (!timeStart || !timeEnd) return; // Time controls may not exist in main view
    
    const startVal = timeStart.value;
    const endVal = timeEnd.value;
    
    if (startVal || endVal) {
      const startText = startVal ? new Date(startVal).toLocaleString() : 'Any time';
      const endText = endVal ? new Date(endVal).toLocaleString() : 'Any time';
      const display = document.getElementById('timeRangeDisplay');
      if (display) {
        display.textContent = `${startText} - ${endText}`;
      }
    } else {
      const display = document.getElementById('timeRangeDisplay');
      if (display) {
        display.textContent = 'All time periods';
      }
    }
  }
  
  function applyFilter() {
    const region = regionSelect.value;
    const magMinValue = parseFloat(magMin.value);
    const magMaxValue = parseFloat(magMax.value);
    const timeStartValue = timeStart ? timeStart.value : null;
    const timeEndValue = timeEnd ? timeEnd.value : null;
    
    if (magMinValue > magMaxValue) {
      showStatus('Minimum magnitude cannot be greater than maximum magnitude', 'error');
      return;
    }
    
    if (timeStartValue && timeEndValue && new Date(timeStartValue) > new Date(timeEndValue)) {
      showStatus('Start time cannot be later than end time', 'error');
      return;
    }
    
    const filters = {
      region: region,
      magMin: magMinValue,
      magMax: magMaxValue,
      timeStart: timeStartValue || null,
      timeEnd: timeEndValue || null
    };
    
    window.api.send('filter-changed', filters);
  }
  
  function resetFilter() {
    regionSelect.value = 'all';
    magMin.value = '0';
    magMax.value = '10';
    if (timeStart) timeStart.value = '';
    if (timeEnd) timeEnd.value = '';
    updateRangeDisplay();
    updateTimeRangeDisplay();
    applyFilter();
  }
  
  // Event listeners
  magMin.addEventListener('input', updateRangeDisplay);
  magMax.addEventListener('input', updateRangeDisplay);
  if (timeStart) {
    timeStart.addEventListener('input', updateTimeRangeDisplay);
    timeStart.addEventListener('change', applyFilter);
  }
  if (timeEnd) {
    timeEnd.addEventListener('input', updateTimeRangeDisplay);
    timeEnd.addEventListener('change', applyFilter);
  }
  applyBtn.addEventListener('click', applyFilter);
  resetBtn.addEventListener('click', resetFilter);
  
  // Auto-apply filter on input change
  regionSelect.addEventListener('change', applyFilter);
  magMin.addEventListener('change', applyFilter);
  magMax.addEventListener('change', applyFilter);
  
  // Initialize
  updateRangeDisplay();
  updateTimeRangeDisplay();
  
  // Set default time range to last 24 hours for easier testing
  if (timeStart && timeEnd) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Format for datetime-local input: "YYYY-MM-DDTHH:MM"
    timeStart.value = yesterday.toISOString().slice(0, 16);
    timeEnd.value = now.toISOString().slice(0, 16);
    
    updateTimeRangeDisplay();
    console.log('🕐 Set default time range to last 24 hours for testing');
  }
  
  // Request regions list
  window.api.send('get-regions');
}

// Control Panel Controls
function setupControlPanelControls() {
  const refreshBtn = document.getElementById('refreshBtn');
  const updateBtn = document.getElementById('updateBtn');
  const autoUpdateCheck = document.getElementById('autoUpdateCheck');
  const sphereScaleSlider = document.getElementById('sphereScale');
  const sphereAlphaSlider = document.getElementById('sphereAlpha');
  
  function updateSliderDisplay() {
    const scaleValue = sphereScaleSlider.value;
    const alphaValue = sphereAlphaSlider.value;
    
    document.getElementById('sphereScaleValue').textContent = `${parseFloat(scaleValue).toFixed(1)}x`;
    document.getElementById('sphereAlphaValue').textContent = parseFloat(alphaValue).toFixed(1);
  }
  
  // Event listeners
  refreshBtn.addEventListener('click', () => {
    // If no data available, generate sample data for testing
    if (currentData.length === 0) {
      generateSampleData();
    } else {
      window.api.send('refresh-view');
    }
    showStatus('Data refreshed', 'success');
  });
  
  updateBtn.addEventListener('click', () => {
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';
    window.api.send('update-data');
    showStatus('Checking for updates...', 'success');
  });
  
  autoUpdateCheck.addEventListener('change', (e) => {
    window.api.send('toggle-auto-update', e.target.checked);
    showStatus(e.target.checked ? 'Auto-update enabled' : 'Auto-update disabled', 'success');
  });
  
  sphereScaleSlider.addEventListener('input', (e) => {
    updateSliderDisplay();
    window.api.send('sphere-scale', parseFloat(e.target.value));
  });
  
  sphereAlphaSlider.addEventListener('input', (e) => {
    updateSliderDisplay();
    window.api.send('sphere-alpha', parseFloat(e.target.value));
  });
  
  // Initialize
  updateSliderDisplay();
}

// Calendar Controls
function setupCalendarControls() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();
  });
  
  nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();
  });
}

// Status Messages
function showStatus(message, type = 'success') {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.innerHTML = message; // Changed from textContent to innerHTML to support HTML
  statusDiv.className = `status-message ${type}`;
  statusDiv.style.display = 'block';
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000); // Increased timeout for details
}

// Generate sample data for testing when no real data is available
function generateSampleData() {
  const sampleData = [
    {
      eventId: 'sample001',
      datetime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      latitude: 35.6762,
      longitude: 139.6503,
      depth: 10,
      magnitude: 4.2,
      region_ja: '東京都',
      region_en: 'Tokyo Metropolis'
    },
    {
      eventId: 'sample002',
      datetime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      latitude: 34.6937,
      longitude: 135.5023,
      depth: 15,
      magnitude: 3.8,
      region_ja: '大阪府',
      region_en: 'Osaka Prefecture'
    },
    {
      eventId: 'sample003',
      datetime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      latitude: 35.2271,
      longitude: 139.0394,
      depth: 25,
      magnitude: 5.1,
      region_ja: '神奈川県',
      region_en: 'Kanagawa Prefecture'
    },
    {
      eventId: 'sample004',
      datetime: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
      latitude: 36.2048,
      longitude: 138.2529,
      depth: 8,
      magnitude: 3.2,
      region_ja: '長野県',
      region_en: 'Nagano Prefecture'
    },
    {
      eventId: 'sample005',
      datetime: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
      latitude: 33.5904,
      longitude: 130.4017,
      depth: 35,
      magnitude: 6.3,
      region_ja: '福岡県',
      region_en: 'Fukuoka Prefecture'
    }
  ];
  
  console.log('Generated sample earthquake data for testing');
  currentData = sampleData;
  updateTable(sampleData);
  
  // Update 3D view if available
  if (scene) {
    createEarthquakeSpheres(sampleData);
  }
  
  // Update calendar
  const counts = {};
  sampleData.forEach(eq => {
    const date = eq.datetime.split('T')[0];
    counts[date] = (counts[date] || 0) + 1;
  });
  dailyCounts = counts;
  if (currentTab === 'calendar') {
    updateCalendar();
  }
}

// Data Table Functions
function formatDateTime(dateTime) {
  if (!dateTime) return '';
  try {
    const date = new Date(dateTime);
    return date.toLocaleString();
  } catch (error) {
    return dateTime;
  }
}

function getMagnitudeClass(magnitude) {
  if (magnitude < 4) return 'mag-low';
  if (magnitude < 6) return 'mag-medium';
  return 'mag-high';
}

function updateTable(data) {
  currentData = data;
  const tbody = document.getElementById('tableBody');
  
  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state" data-i18n-key="no_data">No earthquake data available</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map((eq, index) => `
    <tr data-earthquake-index="${index}" onclick="selectEarthquake(${index})">
      <td>${formatDateTime(eq.datetime)}</td>
      <td>${eq.latitude.toFixed(3)}</td>
      <td>${eq.longitude.toFixed(3)}</td>
      <td>${eq.depth}</td>
      <td class="magnitude ${getMagnitudeClass(eq.magnitude)}">${eq.magnitude}</td>
      <td>${currentLanguage === 'ja' ? eq.region_ja : eq.region_en}</td>
    </tr>
  `).join('');
}

// Function to handle earthquake selection
function selectEarthquake(index) {
  console.log('Row clicked! Index:', index); // Debug log
  const earthquake = currentData[index];
  if (!earthquake) {
    console.log('No earthquake data found for index:', index);
    return;
  }
  
  console.log('Selected earthquake:', earthquake); // Debug log
  
  // Remove previous selection
  document.querySelectorAll('.data-table tbody tr').forEach(row => {
    row.classList.remove('selected');
  });
  
  // Add selection to clicked row
  const selectedRow = document.querySelector(`[data-earthquake-index="${index}"]`);
  if (selectedRow) {
    selectedRow.classList.add('selected');
    console.log('Row highlighted'); // Debug log
  }
  
  // Show earthquake details
  showEarthquakeDetails(earthquake);
  
  // If in 3D view, focus on this earthquake
  if (scene && currentTab === 'visualization') {
    focusOnEarthquake(earthquake);
  }
}

// Function to show earthquake details
function showEarthquakeDetails(earthquake) {
  const details = `
    <strong>Earthquake Details:</strong><br>
    Time: ${formatDateTime(earthquake.datetime)}<br>
    Location: ${earthquake.latitude.toFixed(3)}°, ${earthquake.longitude.toFixed(3)}°<br>
    Depth: ${earthquake.depth} km<br>
    Magnitude: ${earthquake.magnitude}<br>
    Region: ${currentLanguage === 'ja' ? earthquake.region_ja : earthquake.region_en}
  `;
  
  showStatus(details, 'success');
}

// Function to focus on earthquake in 3D view
function focusOnEarthquake(earthquake) {
  if (!scene || !camera) return;
  
  // Find the corresponding sphere
  const targetSphere = earthquakeSpheres.find(sphere => 
    sphere.userData && sphere.userData.eventId === earthquake.eventId
  );
  
  if (targetSphere) {
    // Animate camera to focus on the earthquake
    const targetPosition = targetSphere.position.clone();
    targetPosition.y += 20; // Offset above the sphere
    
    // Simple camera movement (you could use tween.js for smoother animation)
    camera.position.copy(targetPosition);
    camera.lookAt(targetSphere.position);
  }
}

// 3D Visualization Functions
function init3DScene() {
  const container = document.querySelector('.viz-container');
  const canvas = document.getElementById('vizCanvas');
  
  if (!container || !canvas) return;
  
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x001122);
  
  // Camera setup
  const rect = container.getBoundingClientRect();
  camera = new THREE.PerspectiveCamera(75, rect.width / rect.height, 0.1, 10000);
  camera.position.set(0, 100, 200);
  
  // Renderer setup
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(rect.width, rect.height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(100, 100, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // Controls
  setup3DControls();
  
  // Create ground plane
  createGroundPlane();
  
  // Start render loop
  animate3D();
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Create spheres if we have data
  if (currentData.length > 0) {
    createEarthquakeSpheres(currentData);
  }
}

function setup3DControls() {
  let mouseDown = false;
  let mouseButton = 0;
  let mouseX = 0;
  let mouseY = 0;
  let targetRotationX = 0;
  let targetRotationY = 0;
  let targetDistance = 200;
  
  const canvas = document.getElementById('vizCanvas');
  
  canvas.addEventListener('mousedown', (event) => {
    mouseDown = true;
    mouseButton = event.button;
    mouseX = event.clientX;
    mouseY = event.clientY;
  });
  
  canvas.addEventListener('mouseup', () => {
    mouseDown = false;
  });
  
  canvas.addEventListener('mousemove', (event) => {
    if (!mouseDown) return;
    
    const deltaX = event.clientX - mouseX;
    const deltaY = event.clientY - mouseY;
    
    if (mouseButton === 0) { // Left click - rotate
      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;
      targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));
    } else if (mouseButton === 2) { // Right click - pan
      camera.position.x -= deltaX * 0.5;
      camera.position.y += deltaY * 0.5;
    }
    
    mouseX = event.clientX;
    mouseY = event.clientY;
    
    updateCameraPosition();
  });
  
  canvas.addEventListener('wheel', (event) => {
    targetDistance += event.deltaY * 0.1;
    targetDistance = Math.max(10, Math.min(1000, targetDistance));
    updateCameraPosition();
  });
  
  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });
  
  function updateCameraPosition() {
    const x = targetDistance * Math.sin(targetRotationY) * Math.cos(targetRotationX);
    const y = targetDistance * Math.sin(targetRotationX);
    const z = targetDistance * Math.cos(targetRotationY) * Math.cos(targetRotationX);
    
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  }
}

function createGroundPlane() {
  const geometry = new THREE.PlaneGeometry(500, 500, 32, 32);
  const material = new THREE.MeshLambertMaterial({ 
    color: 0x228833,
    transparent: true,
    opacity: 0.3,
    wireframe: true
  });
  
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -50;
  plane.receiveShadow = true;
  scene.add(plane);
}

function clearEarthquakeSpheres() {
  earthquakeSpheres.forEach(sphere => {
    scene.remove(sphere);
    if (sphere.geometry) sphere.geometry.dispose();
    if (sphere.material) sphere.material.dispose();
  });
  earthquakeSpheres = [];
}

function getAgeColor(datetime) {
  const now = new Date();
  const eventTime = new Date(datetime);
  const ageHours = (now - eventTime) / (1000 * 60 * 60);
  
  if (ageHours < 12) {
    return new THREE.Color(1, 0, 0); // Red for recent
  } else {
    return new THREE.Color(1, 1, 0); // Yellow for older
  }
}

function createEarthquakeSpheres(data) {
  if (!scene) return; // Scene not initialized yet
  
  clearEarthquakeSpheres();
  
  if (!data || data.length === 0) {
    document.getElementById('dataCount').textContent = 'No earthquake data';
    return;
  }
  
  // Find bounds for positioning
  const bounds = {
    minLat: Math.min(...data.map(eq => eq.latitude)),
    maxLat: Math.max(...data.map(eq => eq.latitude)),
    minLon: Math.min(...data.map(eq => eq.longitude)),
    maxLon: Math.max(...data.map(eq => eq.longitude))
  };
  
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  
  // Request terrain data for this region
  const terrainBounds = {
    lat_min: bounds.minLat - 0.1,
    lat_max: bounds.maxLat + 0.1,
    lon_min: bounds.minLon - 0.1,
    lon_max: bounds.maxLon + 0.1
  };
  window.api.send('get-terrain-data', terrainBounds);
  
  data.forEach(eq => {
    // Convert lat/lon to world coordinates
    const x = (eq.longitude - centerLon) * 100; // Scale factor
    const z = (eq.latitude - centerLat) * 100;
    const y = -eq.depth * 0.1; // Depth below surface
    
    // Sphere size based on magnitude
    const radius = Math.max(0.5, eq.magnitude * 0.5) * sphereScale;
    
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: getAgeColor(eq.datetime),
      transparent: true,
      opacity: sphereAlpha
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    sphere.castShadow = true;
    sphere.userData = eq; // Store earthquake data
    
    scene.add(sphere);
    earthquakeSpheres.push(sphere);
  });
  
  // Update UI
  document.getElementById('dataCount').textContent = `${data.length} earthquakes displayed`;
}

function updateSphereScale(scale) {
  sphereScale = scale;
  earthquakeSpheres.forEach(sphere => {
    sphere.scale.set(scale, scale, scale);
  });
}

function updateSphereAlpha(alpha) {
  sphereAlpha = alpha;
  earthquakeSpheres.forEach(sphere => {
    sphere.material.opacity = alpha;
  });
}

function animate3D() {
  if (!renderer || !scene || !camera) return;
  
  requestAnimationFrame(animate3D);
  
  // Rotate spheres slowly for visual effect
  earthquakeSpheres.forEach(sphere => {
    sphere.rotation.y += 0.01;
  });
  
  renderer.render(scene, camera);
}

function onWindowResize() {
  if (!camera || !renderer) return;
  
  const container = document.querySelector('.viz-container');
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height);
}

// Calendar Functions
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getActivityClass(count) {
  if (count === 0) return '';
  if (count <= 2) return 'low-activity';
  if (count <= 5) return 'medium-activity';
  return 'high-activity';
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function generateCalendar(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const calendarBody = document.getElementById('calendarBody');
  calendarBody.innerHTML = '';
  
  const monthTitle = document.getElementById('monthTitle');
  monthTitle.textContent = `${monthNames[currentLanguage][month]} ${year}`;
  
  let currentWeekDate = new Date(startDate);
  
  for (let week = 0; week < 6; week++) {
    const row = document.createElement('tr');
    
    for (let day = 0; day < 7; day++) {
      const cell = document.createElement('td');
      const cellDate = new Date(currentWeekDate);
      const dateStr = formatDate(cellDate);
      const dayNumber = cellDate.getDate();
      const count = dailyCounts[dateStr] || 0;
      
      cell.innerHTML = `
        <div class="day-number">${dayNumber}</div>
        <div class="earthquake-count">${count > 0 ? count : ''}</div>
      `;
      
      // Add classes
      if (cellDate.getMonth() !== month) {
        cell.classList.add('other-month');
      }
      
      if (isToday(cellDate)) {
        cell.classList.add('today');
      }
      
      if (count > 0) {
        cell.classList.add('has-earthquakes');
        cell.classList.add(getActivityClass(count));
      }
      
      cell.title = `${dateStr}: ${count} earthquakes`;
      
      row.appendChild(cell);
      currentWeekDate.setDate(currentWeekDate.getDate() + 1);
    }
    
    calendarBody.appendChild(row);
  }
}

function updateCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  generateCalendar(year, month);
}

// Language Update
function updateLanguage(language) {
  currentLanguage = language;
  
  // Update language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-language="${language}"]`).classList.add('active');
  
  // Update i18n texts
  document.querySelectorAll('[data-i18n-key]').forEach(element => {
    const key = element.getAttribute('data-i18n-key');
    if (translations[language] && translations[language][key]) {
      element.textContent = translations[language][key];
    }
  });
  
  // Refresh current data displays
  if (currentData.length > 0) {
    updateTable(currentData);
  }
  
  updateCalendar();
}

// IPC Listeners
function setupIpcListeners() {
  // Data updates
  window.api.receive('filtered-data', (data) => {
    updateTable(data);
    if (scene) {
      createEarthquakeSpheres(data);
    }
  });

  window.api.receive('daily-counts', (counts) => {
    dailyCounts = counts;
    if (currentTab === 'calendar') {
      updateCalendar();
    }
  });

  // Visual controls
  window.api.receive('sphere-scale', (scale) => {
    updateSphereScale(scale);
  });

  window.api.receive('sphere-alpha', (alpha) => {
    updateSphereAlpha(alpha);
  });

  // Language changes
  window.api.receive('language-changed', (language) => {
    updateLanguage(language);
  });

  // Terrain data
  window.api.receive('terrain-data', (data) => {
    console.log('Received terrain data:', data);
    terrainData = data;
    // TODO: Create terrain mesh (simplified for now)
  });

  window.api.receive('terrain-error', (error) => {
    console.error('Terrain error:', error);
  });

  // Regions list
  window.api.receive('regions-list', (regions) => {
    availableRegions = regions;
    const select = document.getElementById('regionSelect');
    select.innerHTML = '<option value="all" data-i18n-key="all_regions">All Regions</option>';
    
    regions.filter(region => region !== 'all').forEach(region => {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = region;
      select.appendChild(option);
    });
  });

  // Status updates
  window.api.receive('update-complete', (newCount) => {
    const btn = document.getElementById('updateBtn');
    btn.disabled = false;
    btn.textContent = 'Update';
    showStatus(`Update complete. Found ${newCount} new earthquakes.`, 'success');
  });

  window.api.receive('error', (error) => {
    showStatus(error, 'error');
  });
}

// Make functions available globally for onclick handlers
window.selectEarthquake = selectEarthquake;

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('🔥 DOM Content Loaded - Initializing app...');
  try {
    initializeApp();
    console.log('✅ App initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing app:', error);
  }
});

// Fallback initialization
if (document.readyState === 'loading') {
  console.log('📊 Document still loading, waiting for DOMContentLoaded...');
} else {
  console.log('📊 Document already loaded, initializing immediately...');
  setTimeout(() => {
    try {
      initializeApp();
      console.log('✅ App initialized successfully (fallback)!');
    } catch (error) {
      console.error('❌ Error initializing app (fallback):', error);
    }
  }, 100);
}