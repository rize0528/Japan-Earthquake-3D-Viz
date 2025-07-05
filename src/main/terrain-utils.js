const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TerrainUtils {
  constructor(cacheDir) {
    this.cacheDir = path.join(cacheDir, 'terrain');
    this.ensureTerrainCacheDir();
  }

  ensureTerrainCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  // Convert lat/lon to tile coordinates
  latLonToTile(lat, lon, zoom) {
    const lat_rad = lat * Math.PI / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.asinh(Math.tan(lat_rad)) / Math.PI) / 2 * n);
    return { x, y, z: zoom };
  }

  // Convert tile coordinates to lat/lon bounds
  tileToBounds(x, y, z) {
    const n = Math.pow(2, z);
    const lon_min = x / n * 360 - 180;
    const lon_max = (x + 1) / n * 360 - 180;
    const lat_min = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    const lat_max = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    return { lon_min, lon_max, lat_min, lat_max };
  }

  // Get cache file path for a tile
  getTileCachePath(x, y, z) {
    return path.join(this.cacheDir, `dem_${z}_${x}_${y}.txt`);
  }

  // Fetch elevation data for a single tile
  async fetchTileData(x, y, z) {
    const cachePath = this.getTileCachePath(x, y, z);
    
    // Check if cached
    if (fs.existsSync(cachePath)) {
      try {
        console.log(`📂 Using cached terrain tile ${z}/${x}/${y}`);
        return fs.readFileSync(cachePath, 'utf8');
      } catch (error) {
        console.error('Error reading cached tile:', error);
      }
    }

    try {
      // GSI elevation tile URL
      const url = `https://cyberjapandata.gsi.go.jp/xyz/dem_png/${z}/${x}/${y}.txt`;
      console.log(`📥 Downloading terrain tile ${z}/${x}/${y} from GSI...`);
      const response = await axios.get(url, { timeout: 10000 });
      console.log(`✅ Downloaded terrain tile ${z}/${x}/${y} successfully`);
      
      // Cache the data
      fs.writeFileSync(cachePath, response.data);
      console.log(`💾 Cached terrain tile ${z}/${x}/${y}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching tile ${z}/${x}/${y}:`, error.message);
      return null;
    }
  }

  // Parse elevation data from text format
  parseElevationData(data) {
    if (!data || typeof data !== 'string') return null;
    
    const lines = data.trim().split('\n');
    const elevations = [];
    
    for (const line of lines) {
      const values = line.split(/\s+/).map(val => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      });
      elevations.push(...values);
    }
    
    return elevations;
  }

  // Get elevation data for a region
  async getRegionElevation(bounds, zoom = 14, progressCallback = null) {
    const { lat_min, lat_max, lon_min, lon_max } = bounds;
    
    // Get tile bounds
    const topLeft = this.latLonToTile(lat_max, lon_min, zoom);
    const bottomRight = this.latLonToTile(lat_min, lon_max, zoom);
    
    const tiles = [];
    const elevationData = [];
    
    // Limit the number of tiles to avoid overwhelming the API
    const maxTiles = 16;
    const tileCount = (bottomRight.x - topLeft.x + 1) * (bottomRight.y - topLeft.y + 1);
    
    if (tileCount > maxTiles) {
      console.warn(`Too many tiles (${tileCount}), using lower zoom level`);
      zoom = Math.max(10, zoom - 2);
      if (progressCallback) {
        progressCallback(0, `Too many tiles, reducing zoom to ${zoom}`);
      }
      return this.getRegionElevation(bounds, zoom, progressCallback);
    }

    console.log(`Fetching ${tileCount} elevation tiles at zoom ${zoom}`);
    if (progressCallback) {
      progressCallback(10, `Fetching ${tileCount} elevation tiles`);
    }
    
    let processedTiles = 0;
    
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      for (let x = topLeft.x; x <= bottomRight.x; x++) {
        try {
          const progress = 10 + (processedTiles / tileCount) * 80;
          if (progressCallback) {
            progressCallback(progress, `Fetching tile ${processedTiles + 1}/${tileCount}`);
          }
          
          const tileData = await this.fetchTileData(x, y, zoom);
          if (tileData) {
            const elevations = this.parseElevationData(tileData);
            if (elevations && elevations.length > 0) {
              const tileBounds = this.tileToBounds(x, y, zoom);
              tiles.push({
                x, y, z: zoom,
                bounds: tileBounds,
                elevations: elevations,
                size: Math.sqrt(elevations.length)
              });
            }
          }
          
          processedTiles++;
        } catch (error) {
          console.error(`Error processing tile ${x},${y}:`, error);
          processedTiles++;
        }
      }
    }
    
    if (progressCallback) {
      progressCallback(95, 'Processing elevation data...');
    }
    
    return {
      tiles,
      bounds: { lat_min, lat_max, lon_min, lon_max },
      zoom
    };
  }

  // Interpolate elevation at a specific lat/lon
  interpolateElevation(lat, lon, terrainData) {
    if (!terrainData || !terrainData.tiles) return 0;
    
    // Find the tile containing this point
    for (const tile of terrainData.tiles) {
      const { bounds, elevations, size } = tile;
      
      if (lat >= bounds.lat_min && lat <= bounds.lat_max &&
          lon >= bounds.lon_min && lon <= bounds.lon_max) {
        
        // Convert to tile-local coordinates
        const localX = (lon - bounds.lon_min) / (bounds.lon_max - bounds.lon_min);
        const localY = (bounds.lat_max - lat) / (bounds.lat_max - bounds.lat_min);
        
        // Get grid indices
        const gridX = Math.floor(localX * (size - 1));
        const gridY = Math.floor(localY * (size - 1));
        
        // Bounds check
        if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
          const index = gridY * size + gridX;
          return elevations[index] || 0;
        }
      }
    }
    
    return 0;
  }

  // Generate terrain geometry data for renderer
  createTerrainGeometryData(terrainData, scale = 1000) {
    if (!terrainData || !terrainData.tiles || terrainData.tiles.length === 0) {
      return null;
    }
    
    const { bounds } = terrainData;
    const resolution = 100; // Grid resolution
    
    const width = (bounds.lon_max - bounds.lon_min) * scale;
    const height = (bounds.lat_max - bounds.lat_min) * scale;
    
    // Generate grid points and elevations
    const vertices = [];
    const elevations = [];
    
    for (let y = 0; y <= resolution; y++) {
      for (let x = 0; x <= resolution; x++) {
        const worldX = (x / resolution - 0.5) * width;
        const worldZ = (y / resolution - 0.5) * height;
        
        // Convert to lat/lon
        const lon = bounds.lon_min + (worldX / scale + (bounds.lon_max - bounds.lon_min) / 2);
        const lat = bounds.lat_min + (worldZ / scale + (bounds.lat_max - bounds.lat_min) / 2);
        
        const elevation = this.interpolateElevation(lat, lon, terrainData);
        
        vertices.push(worldX, elevation * 0.01, worldZ);
        elevations.push(elevation);
      }
    }
    
    return {
      vertices,
      elevations,
      width,
      height,
      resolution
    };
  }
}

module.exports = TerrainUtils;