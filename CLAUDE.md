# Japan Earthquake 3D Visualization - Claude Code Analysis

## Repository Overview
This is an Electron-based application for visualizing earthquake data from Japan's JMA (Japan Meteorological Agency) in 3D using Three.js.

## Technology Stack
- **Main Framework**: Electron (v27.0.0)
- **3D Visualization**: Three.js (v0.157.0) 
- **Data Processing**: danfojs-node, axios, cheerio
- **Language**: JavaScript (ES6+)
- **UI**: HTML/CSS with custom styling

## Architecture

### Main Process (`src/main/index.js`)
- Handles earthquake data fetching from JMA JSON API
- Manages data caching in local filesystem
- Implements filtering logic (region, magnitude range)
- Provides terrain data integration
- IPC communication with renderer processes

### Renderer Process (`src/renderer/`)
- **main.html**: Main application interface with tab navigation
- **js/main.js**: Core application logic and 3D visualization
- **visualization.html**: Dedicated 3D visualization view
- **filter.html**: Filter controls interface

### Data Structure
Earthquake records contain:
```javascript
{
  eventId: string,
  datetime: string (ISO format),
  latitude: number,
  longitude: number, 
  depth: number (km),
  magnitude: number,
  region_ja: string,
  region_en: string,
  intensity: string
}
```

## Current Filtering System
The application currently supports:
1. **Region filtering**: By region name (dropdown selection)
2. **Magnitude filtering**: Range slider with min/max values (0-10)

### Filter Implementation Location
- Filter UI: `src/renderer/filter.html` (lines 105-112)
- Filter Logic: `src/main/index.js` (lines 86-101)
- Filter Controls: `src/renderer/js/main.js` (lines 144-200)

## Time Range Filter Implementation Plan

### Current Time Handling
- Earthquake data includes `datetime` field in ISO format
- Calendar view exists showing daily earthquake counts
- No current time-based filtering beyond the calendar visualization

### Proposed Implementation
1. **Add time range controls** to filter UI alongside existing magnitude range
2. **Extend filter object** to include `timeStart` and `timeEnd` properties  
3. **Update filter logic** in main process to filter by datetime range
4. **Integrate with existing** magnitude and region filters

### Key Files to Modify
1. `src/renderer/filter.html` - Add time range trackbar UI
2. `src/renderer/js/main.js` - Add time filter controls setup
3. `src/main/index.js` - Extend `applyFilters()` function (line 86)

### Testing Commands
- `npm start` - Run in development mode
- `npm run dev` - Run with development flags
- No specific test scripts found - manual testing required

## Data Source
- Primary: JMA JSON API (`https://www.jma.go.jp/bosai/quake/data/list.json`)
- Fallback: JMA RSS feed for historical data
- Data is cached locally in `~/.cache_data/` directory

## 3D Visualization Features
- Sphere size proportional to magnitude
- Color coding by age (red=recent, yellow=older)
- Interactive camera controls (rotate, zoom, pan)
- Terrain mesh integration
- Real-time earthquake selection and highlighting