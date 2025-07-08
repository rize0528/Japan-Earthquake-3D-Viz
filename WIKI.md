# Japan Earthquake 3D Visualization - Project Wiki

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technical Architecture](#technical-architecture)
4. [Installation & Setup](#installation--setup)
5. [User Guide](#user-guide)
6. [Developer Documentation](#developer-documentation)
7. [API Reference](#api-reference)
8. [Contributing](#contributing)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## 🌍 Project Overview

The **Japan Earthquake 3D Visualization** is a comprehensive desktop application that provides real-time 3D visualization of earthquake data from Japan's Meteorological Agency (JMA). Built with Electron and Three.js, it offers an intuitive interface for researchers, educators, and the general public to understand seismic activity in Japan.

### 🎯 Purpose

- **Research Tool**: Enable seismic researchers to analyze earthquake patterns and trends
- **Educational Resource**: Provide an interactive platform for learning about earthquakes
- **Public Awareness**: Make earthquake information accessible to the general public
- **Data Visualization**: Transform complex seismic data into understandable 3D representations

### 🌟 Key Highlights

- **Real-time Data**: Live updates from JMA's official earthquake database
- **3D Visualization**: Interactive 3D representation of earthquake events
- **Advanced Filtering**: Multi-criteria filtering by region, magnitude, and time
- **Terrain Integration**: Accurate elevation data from GSI (Geospatial Information Authority)
- **Bilingual Support**: Full Japanese and English localization
- **Cross-platform**: Available on Windows, macOS, and Linux

---

## ✨ Features

### 🔍 Data Management

#### Real-time Data Fetching
- **Primary Source**: JMA JSON API (`https://www.jma.go.jp/bosai/quake/data/list.json`)
- **Fallback Sources**: JMA RSS feeds for historical data
- **Update Frequency**: Automatic updates every 30 minutes (configurable)
- **Data Caching**: Local filesystem storage for offline functionality

#### Historical Data Support
- **Date Range**: Configurable from 1 day to 1 year
- **Data Persistence**: Cached data organized by date for quick access
- **Incremental Updates**: Only fetches new earthquake events to optimize performance

### 🎨 3D Visualization

#### Interactive 3D View
- **Sphere Representation**: Each earthquake displayed as a colored sphere
- **Magnitude Scaling**: Sphere size proportional to earthquake magnitude
- **Age-based Coloring**: 
  - 🔴 Red: Recent earthquakes (<12 hours)
  - 🟡 Yellow: Older earthquakes (>12 hours)
- **Interactive Controls**:
  - Mouse rotation, zoom, and pan
  - Navigation cube for orientation
  - Smooth camera animations

#### Terrain Integration
- **Real Elevation Data**: GSI elevation tiles at 14m resolution
- **Accurate Positioning**: Precise geographic coordinate mapping
- **Coastal Boundaries**: High-resolution Japan coastline from Natural Earth data
- **3D Terrain Mesh**: Optional terrain visualization for geographic context

### 📊 Advanced Filtering System

#### Region-based Filtering
- **Coverage**: All Japanese regions and prefectures
- **Selection**: Dropdown menu with bilingual region names
- **Real-time Updates**: Instant visualization updates on filter changes

#### Magnitude Range Filtering
- **Range**: 0.0 to 10.0 magnitude scale
- **Precision**: 0.1 magnitude increments
- **Real-time Display**: Live range indicator with current values

#### Time Range Filtering
- **Date Picker**: Intuitive datetime selection interface
- **Flexible Ranges**: From specific dates to open-ended periods
- **Persistence**: Filter settings saved across application sessions

### 🖥️ User Interface

#### Multi-View Layout
- **Tab Navigation**: Overview, Data Table, 3D View, Calendar
- **Sidebar Controls**: Scrollable filter and control panels
- **Responsive Design**: Adaptive layouts for different screen sizes

#### Bilingual Support
- **Languages**: Japanese (日本語) and English
- **Runtime Switching**: Change language without restart
- **Localized Data**: Region names, dates, and UI text
- **Cultural Context**: Appropriate formatting for each language

#### Accessibility Features
- **Scrollable Controls**: Accessible control panels regardless of window size
- **Keyboard Navigation**: Full keyboard support for all features
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast**: Clear visual hierarchy and readable text

### 📅 Data Views

#### Calendar View
- **Monthly Grid**: Visual representation of daily earthquake activity
- **Activity Heatmap**: Color-coded days based on earthquake frequency
- **Interactive**: Click dates to filter and view specific day's events
- **Navigation**: Previous/next month controls with smooth transitions

#### Data Table View
- **Sortable Columns**: Click headers to sort by any field
- **Comprehensive Data**: Event ID, time, location, magnitude, intensity
- **Search Functionality**: Filter table contents in real-time
- **Export Options**: Copy data for external analysis

---

## 🏗️ Technical Architecture

### 🔧 Technology Stack

#### Core Framework
- **Electron 27.0.0**: Cross-platform desktop application framework
- **Node.js**: Backend JavaScript runtime
- **Chromium**: Modern web rendering engine

#### 3D Graphics
- **Three.js 0.157.0**: WebGL-based 3D graphics library
- **WebGL**: Hardware-accelerated 3D rendering
- **Custom Shaders**: Optimized rendering for large datasets

#### Data Processing
- **axios 1.5.0**: HTTP client for API requests
- **cheerio 1.0.0-rc.12**: Server-side HTML parsing
- **danfojs-node 1.1.2**: Data manipulation and analysis

#### Development Tools
- **electron-builder 24.6.4**: Application packaging and distribution
- **Custom Build Pipeline**: Automated testing and deployment

### 🏛️ Application Architecture

#### Multi-Process Design
```
┌─────────────────────┐    ┌─────────────────────┐
│    Main Process     │    │  Renderer Process   │
│  (Backend Logic)    │◄──►│   (User Interface)  │
│                     │    │                     │
│ • Data Fetching     │    │ • UI Rendering      │
│ • Caching           │    │ • User Interactions │
│ • Filtering         │    │ • 3D Visualization  │
│ • File Operations   │    │ • Event Handling    │
└─────────────────────┘    └─────────────────────┘
           │                           │
           └─────────── IPC ───────────┘
```

#### Data Flow Pipeline
```
JMA API → Data Fetching → Parsing → Caching → Filtering → Visualization
    │                                                            │
    └─────────────── Error Handling & Fallbacks ────────────────┘
```

### 📁 Project Structure

```
Japan-Earthquake-3D-Viz/
├── src/
│   ├── main/                    # Main Electron process
│   │   ├── index.js            # Application entry point (1,311 lines)
│   │   └── terrain-utils.js    # Geographic utilities
│   ├── renderer/               # UI components
│   │   ├── main.html          # Primary interface
│   │   ├── filter.html        # Filter controls
│   │   ├── visualization.html # 3D view
│   │   ├── calendar.html      # Calendar view
│   │   ├── table.html         # Data table
│   │   ├── control.html       # Control panel
│   │   └── js/                # JavaScript modules
│   │       ├── main.js        # Core logic (1,057 lines)
│   │       ├── i18n.js        # Internationalization
│   │       └── progress.js    # Progress tracking
│   └── shared/
│       └── preload.js         # IPC bridge
├── package.json               # Dependencies and scripts
├── CLAUDE.md                  # Project documentation
├── WIKI.md                    # This wiki file
└── README.md                  # Project overview
```

### 🔐 Security Implementation

#### IPC Security
- **Context Isolation**: Secure communication between processes
- **Channel Validation**: Whitelist-based IPC channel validation
- **Sanitized Data**: All external data sanitized before processing

#### Data Protection
- **Local Storage**: Secure local file system caching
- **No Sensitive Data**: No personal information stored
- **Read-only Access**: Application only reads earthquake data

---

## 🚀 Installation & Setup

### 📋 Prerequisites

#### System Requirements
- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 1GB free space for application and cache
- **Graphics**: DirectX 11 or OpenGL 3.3 compatible graphics card

#### Software Dependencies
- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 7.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository

### 💻 Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/rize0528/Japan-Earthquake-3D-Viz.git
cd Japan-Earthquake-3D-Viz
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Run the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

#### 4. Build for Distribution
```bash
npm run build
```

### 📦 Package Contents

After installation, the application structure includes:

```
Application/
├── earthquake-viz.exe         # Main executable (Windows)
├── resources/
│   ├── app.asar              # Application code bundle
│   └── icons/                # Application icons
├── locales/                  # Language files
├── cache/                    # Data cache directory
└── logs/                     # Application logs
```

### 🔧 Configuration

#### Environment Variables
```bash
# Optional: Custom cache directory
CACHE_DIR=/custom/cache/path

# Optional: API timeout (milliseconds)
API_TIMEOUT=30000

# Optional: Enable debug logging
DEBUG=true
```

#### Configuration Files
- **User Settings**: Stored in `~/.config/earthquake-viz/settings.json`
- **Cache Location**: `~/.cache/earthquake-viz/`
- **Logs**: `~/.local/share/earthquake-viz/logs/`

---

## 📖 User Guide

### 🎯 Getting Started

#### First Launch
1. **Initial Setup**: Application automatically downloads recent earthquake data
2. **Language Selection**: Choose between Japanese and English
3. **Data Loading**: Wait for initial data cache to populate
4. **Interface Overview**: Familiarize yourself with the tab-based interface

#### Navigation Basics
- **Tab Navigation**: Click tabs to switch between views
- **Sidebar Controls**: Use the scrollable sidebar for filters and settings
- **Language Toggle**: Click language buttons in the header to switch languages

### 🔍 Using Filters

#### Region Filter
```
1. Open the "Filter Settings" section in the sidebar
2. Select "Region Filter" dropdown
3. Choose from available regions:
   - All Regions (default)
   - Hokkaido
   - Tohoku
   - Kanto
   - Chubu
   - Kansai
   - Chugoku
   - Shikoku
   - Kyushu
   - Okinawa
4. Filter is applied automatically
```

#### Magnitude Range Filter
```
1. Locate "Magnitude Range" in the filter section
2. Set minimum magnitude (0.0-10.0)
3. Set maximum magnitude (0.0-10.0)
4. Range display updates in real-time
5. Filter applies immediately
```

#### Time Range Filter
```
1. Find "Time Range" controls
2. Set start date/time (optional)
3. Set end date/time (optional)
4. Leave blank for open-ended ranges
5. Display shows selected range
```

### 🎮 3D Visualization Controls

#### Mouse Controls
- **Rotation**: Left-click and drag to rotate the view
- **Zoom**: Mouse wheel to zoom in/out
- **Pan**: Right-click and drag to pan the view
- **Reset**: Double-click to reset to default view

#### Navigation Cube
- **Orientation**: Small cube shows current camera orientation
- **Quick Views**: Click cube faces for standard views (front, back, top, etc.)
- **Smooth Transitions**: Animated camera movements

#### Visual Customization
- **Sphere Size**: Adjust earthquake sphere size (0.5x to 100x)
- **Transparency**: Control sphere transparency (0.1 to 1.0)
- **Place Names**: Toggle and scale geographic labels

### 📊 Data Views

#### Calendar View
- **Monthly Navigation**: Use arrow buttons to change months
- **Activity Visualization**: Color intensity indicates earthquake frequency
- **Date Selection**: Click dates to filter events for specific days
- **Today Indicator**: Current date highlighted

#### Data Table View
- **Sorting**: Click column headers to sort data
- **Columns**: Event ID, Date/Time, Location, Magnitude, Intensity
- **Search**: Filter table contents using search box
- **Row Selection**: Click rows to highlight events in 3D view

### ⚙️ Settings and Preferences

#### Visual Settings
- **Sphere Scale**: Adjust size of earthquake spheres
- **Alpha/Transparency**: Control sphere transparency
- **Language**: Switch between Japanese and English
- **Theme**: Light/dark mode (system preference)

#### Data Settings
- **Auto-update**: Enable/disable automatic data updates
- **Update Interval**: Set update frequency (15-60 minutes)
- **Historical Range**: Choose data retention period
- **Cache Management**: Clear cache or view cache size

#### Performance Settings
- **Rendering Quality**: Adjust 3D rendering quality
- **Frame Rate**: Set target FPS (30/60/120)
- **Memory Usage**: Monitor and optimize memory usage

### 🔄 Data Management

#### Updating Data
- **Manual Update**: Click "Update" button in controls
- **Auto-update**: Enable automatic updates in settings
- **Status Indicator**: Monitor update status in sidebar

#### Cache Management
- **View Cache**: Check cache size and data coverage
- **Clear Cache**: Remove all cached data to force fresh download
- **Selective Cleanup**: Remove data older than specified date

---

## 👨‍💻 Developer Documentation

### 🛠️ Development Environment Setup

#### Required Tools
```bash
# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install git

# Clone and setup
git clone https://github.com/rize0528/Japan-Earthquake-3D-Viz.git
cd Japan-Earthquake-3D-Viz
npm install
```

#### Development Scripts
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### 🏗️ Architecture Deep Dive

#### Main Process (src/main/index.js)
```javascript
// Core responsibilities:
// 1. Application lifecycle management
// 2. Data fetching and caching
// 3. File system operations
// 4. IPC communication with renderer

class MainProcess {
  constructor() {
    this.dataCache = new Map();
    this.updateInterval = null;
    this.filterSettings = {};
  }

  async fetchEarthquakeData() {
    // Fetch from JMA API
    // Parse and validate data
    // Cache to filesystem
    // Notify renderer of updates
  }

  applyFilters(criteria) {
    // Filter by region, magnitude, time
    // Return filtered dataset
    // Update UI through IPC
  }
}
```

#### Renderer Process (src/renderer/js/main.js)
```javascript
// Core responsibilities:
// 1. UI rendering and updates
// 2. 3D visualization with Three.js
// 3. User interaction handling
// 4. Settings management

class VisualizationEngine {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();
    this.earthquakeSpheres = [];
  }

  createEarthquakeSphere(earthquake) {
    // Create sphere geometry
    // Apply magnitude-based scaling
    // Set color based on age
    // Position using coordinates
  }

  updateVisualization(data) {
    // Clear existing spheres
    // Create new spheres from data
    // Update scene
    // Render frame
  }
}
```

### 🔌 IPC Communication

#### Secure Channel Setup
```javascript
// src/shared/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Send data to main process
  send: (channel, data) => {
    const validChannels = ['filter-changed', 'update-data', 'language-changed'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Receive data from main process
  receive: (channel, func) => {
    const validChannels = ['filtered-data', 'update-complete', 'error'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
```

#### Available IPC Channels
```javascript
// Main → Renderer
'filtered-data'      // Filtered earthquake dataset
'update-complete'    // Data update finished
'regions-list'       // Available regions
'error'              // Error messages
'language-changed'   // Language switch confirmation

// Renderer → Main
'filter-changed'     // Filter criteria updated
'update-data'        // Manual data update request
'language-changed'   // Language switch request
'get-regions'        // Request regions list
'refresh-view'       // Refresh visualization
```

### 🎨 Three.js Integration

#### Scene Setup
```javascript
// Initialize 3D scene
function initializeScene() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Sky blue

  // Setup camera
  camera = new THREE.PerspectiveCamera(
    75,                                    // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                                   // Near clipping plane
    1000                                   // Far clipping plane
  );

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}
```

#### Sphere Creation
```javascript
function createEarthquakeSphere(earthquake) {
  // Calculate sphere size based on magnitude
  const size = Math.pow(earthquake.magnitude, 1.5) * 0.5;
  
  // Create geometry and material
  const geometry = new THREE.SphereGeometry(size, 16, 16);
  const material = new THREE.MeshPhongMaterial({
    color: getAgeColor(earthquake.datetime),
    transparent: true,
    opacity: 0.7
  });
  
  // Create mesh and position
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(
    earthquake.longitude,
    earthquake.latitude,
    -earthquake.depth * 0.1
  );
  
  // Add to scene
  scene.add(sphere);
  return sphere;
}
```

### 🗃️ Data Management

#### Cache Structure
```
cache/
├── 2024-01-01.json    # Daily earthquake data
├── 2024-01-02.json
├── ...
├── regions.json       # Available regions
├── settings.json      # User preferences
└── metadata.json      # Cache metadata
```

#### Data Format
```javascript
// Earthquake data structure
{
  "eventId": "20240101123456",
  "datetime": "2024-01-01T12:34:56+09:00",
  "latitude": 35.6762,
  "longitude": 139.6503,
  "depth": 10,
  "magnitude": 4.5,
  "region_ja": "東京都",
  "region_en": "Tokyo",
  "intensity": "3"
}
```

### 🧪 Testing

#### Unit Tests
```javascript
// Test data parsing
describe('DataParser', () => {
  it('should parse JMA JSON correctly', () => {
    const rawData = mockJMAData;
    const parsed = parseJMAData(rawData);
    expect(parsed).toHaveLength(5);
    expect(parsed[0]).toHaveProperty('magnitude');
  });
});
```

#### Integration Tests
```javascript
// Test filter functionality
describe('FilterSystem', () => {
  it('should filter by magnitude range', () => {
    const data = mockEarthquakeData;
    const filtered = applyFilters(data, {
      magMin: 3.0,
      magMax: 5.0
    });
    expect(filtered.every(eq => eq.magnitude >= 3.0 && eq.magnitude <= 5.0)).toBe(true);
  });
});
```

### 🔧 Build Process

#### Build Configuration
```javascript
// package.json
{
  "build": {
    "appId": "com.earthquake-viz.app",
    "productName": "Japan Earthquake 3D Visualization",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "mac": {
      "icon": "assets/icon.icns"
    },
    "win": {
      "icon": "assets/icon.ico"
    },
    "linux": {
      "icon": "assets/icon.png"
    }
  }
}
```

#### Platform-specific Builds
```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:mac
npm run build:win
npm run build:linux

# Build for all platforms
npm run build:all
```

---

## 📚 API Reference

### 🌐 External APIs

#### JMA Earthquake API
```javascript
// Primary endpoint
const JMA_API_URL = 'https://www.jma.go.jp/bosai/quake/data/list.json';

// Response format
{
  "eventId": "string",
  "datetime": "ISO 8601 string",
  "latitude": number,
  "longitude": number,
  "depth": number,
  "magnitude": number,
  "region": "string",
  "intensity": "string"
}
```

#### GSI Elevation API
```javascript
// Elevation tile endpoint
const GSI_ELEVATION_URL = 'https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/{z}/{x}/{y}.png';

// Usage
async function getElevationTile(z, x, y) {
  const response = await fetch(`${GSI_ELEVATION_URL}/${z}/${x}/${y}.png`);
  return await response.arrayBuffer();
}
```

### 🔗 Internal APIs

#### Main Process API
```javascript
// Data management
class DataManager {
  async fetchEarthquakeData(dateRange) {
    // Fetch earthquake data for date range
    // Returns: Promise<EarthquakeData[]>
  }

  async getCachedData(date) {
    // Get cached data for specific date
    // Returns: Promise<EarthquakeData[]>
  }

  applyFilters(data, criteria) {
    // Apply filtering criteria to dataset
    // Returns: EarthquakeData[]
  }
}

// Cache management
class CacheManager {
  async saveData(date, data) {
    // Save earthquake data to cache
    // Returns: Promise<void>
  }

  async clearCache(olderThan) {
    // Clear cache data older than date
    // Returns: Promise<void>
  }

  getCacheSize() {
    // Get total cache size
    // Returns: number (bytes)
  }
}
```

#### Renderer Process API
```javascript
// Visualization engine
class VisualizationEngine {
  initialize(container) {
    // Initialize 3D scene
    // Returns: void
  }

  updateData(earthquakeData) {
    // Update visualization with new data
    // Returns: void
  }

  setFilters(criteria) {
    // Apply visual filters
    // Returns: void
  }

  exportView(format) {
    // Export current view as image
    // Returns: Promise<Blob>
  }
}

// UI management
class UIManager {
  showNotification(message, type) {
    // Display notification to user
    // Returns: void
  }

  updateProgress(percent) {
    // Update progress indicator
    // Returns: void
  }

  toggleLanguage(language) {
    // Switch interface language
    // Returns: void
  }
}
```

### 📊 Data Structures

#### EarthquakeData
```typescript
interface EarthquakeData {
  eventId: string;           // Unique event identifier
  datetime: string;          // ISO 8601 datetime
  latitude: number;          // Latitude (-90 to 90)
  longitude: number;         // Longitude (-180 to 180)
  depth: number;             // Depth in kilometers
  magnitude: number;         // Magnitude (0-10)
  region_ja: string;         // Japanese region name
  region_en: string;         // English region name
  intensity: string;         // JMA intensity scale
}
```

#### FilterCriteria
```typescript
interface FilterCriteria {
  region?: string;           // Region filter
  magMin?: number;           // Minimum magnitude
  magMax?: number;           // Maximum magnitude
  timeStart?: string;        // Start datetime (ISO 8601)
  timeEnd?: string;          // End datetime (ISO 8601)
}
```

#### AppSettings
```typescript
interface AppSettings {
  language: 'ja' | 'en';     // Interface language
  autoUpdate: boolean;       // Auto-update enabled
  updateInterval: number;    // Update interval (minutes)
  sphereScale: number;       // Sphere size multiplier
  sphereAlpha: number;       // Sphere transparency
  filters: FilterCriteria;   // Current filter settings
}
```

---

## 🤝 Contributing

### 📋 Development Guidelines

#### Code Style
- **JavaScript**: ES6+ syntax with async/await
- **Formatting**: Prettier configuration with 2-space indentation
- **Linting**: ESLint with recommended rules
- **Comments**: JSDoc for functions and classes

#### Commit Messages
```
feat: add new filtering capability
fix: resolve memory leak in 3D rendering
docs: update API documentation
style: format code with prettier
refactor: optimize data caching logic
test: add unit tests for filter system
```

#### Pull Request Process
1. **Fork Repository**: Create personal fork
2. **Create Branch**: Feature branch from main
3. **Implement Changes**: Follow code style guidelines
4. **Add Tests**: Include unit and integration tests
5. **Update Documentation**: Update relevant documentation
6. **Submit PR**: Clear description and test results

### 🐛 Bug Reports

#### Issue Template
```markdown
**Bug Description**
Clear description of the issue

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [Windows/Mac/Linux]
- Node.js version: [version]
- Application version: [version]

**Screenshots**
If applicable, add screenshots
```

### 💡 Feature Requests

#### Request Template
```markdown
**Feature Description**
Clear description of the requested feature

**Use Case**
Why this feature would be valuable

**Proposed Implementation**
How this might be implemented

**Alternatives**
Alternative solutions considered
```

### 📝 Documentation

#### Documentation Standards
- **Markdown**: All documentation in Markdown format
- **Code Examples**: Include working code examples
- **Screenshots**: Visual aids for UI documentation
- **API Docs**: Complete parameter and return value documentation

---

## 🔧 Troubleshooting

### ⚠️ Common Issues

#### Application Won't Start
```bash
# Check Node.js version
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

#### Data Loading Issues
```javascript
// Check network connectivity
// Verify API endpoints are accessible
// Clear application cache
// Check firewall settings
```

#### 3D Rendering Problems
```javascript
// Update graphics drivers
// Check WebGL support: chrome://gpu/
// Reduce rendering quality in settings
// Disable hardware acceleration if needed
```

#### Memory Issues
```javascript
// Monitor memory usage in Task Manager
// Reduce historical data range
// Clear cache regularly
// Close other applications
```

### 📊 Performance Optimization

#### Recommended Settings
```javascript
// For optimal performance
{
  "sphereScale": 1.0,        // Default sphere size
  "sphereAlpha": 0.7,        // Moderate transparency
  "updateInterval": 30,      // 30-minute updates
  "historicalRange": 7,      // 7 days of data
  "renderQuality": "medium"  // Balanced quality
}
```

#### System Requirements
- **Minimum**: 4GB RAM, integrated graphics
- **Recommended**: 8GB RAM, dedicated graphics card
- **Optimal**: 16GB RAM, modern GPU with 2GB+ VRAM

### 🔍 Debugging

#### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start

# Check logs
tail -f ~/.local/share/earthquake-viz/logs/main.log
```

#### Performance Profiling
```javascript
// Enable performance monitoring
performance.mark('start-render');
// ... rendering code ...
performance.mark('end-render');
performance.measure('render-time', 'start-render', 'end-render');
```

---

## ❓ FAQ

### 🌐 General Questions

#### Q: Is this application free to use?
A: Yes, this is an open-source application available under the MIT license.

#### Q: What data sources are used?
A: Primary data comes from Japan's Meteorological Agency (JMA) official APIs, with elevation data from GSI.

#### Q: How frequently is data updated?
A: Data is automatically updated every 30 minutes by default, but this can be configured.

#### Q: Can I use this for commercial purposes?
A: Yes, the MIT license allows commercial use with proper attribution.

### 💻 Technical Questions

#### Q: Why does the application use so much memory?
A: The application renders 3D graphics and caches earthquake data. Memory usage depends on the data range and visual quality settings.

#### Q: Can I export the visualization?
A: Currently, you can take screenshots. Export functionality is planned for future versions.

#### Q: How accurate is the earthquake data?
A: Data comes directly from JMA, which is the official source for earthquake information in Japan.

#### Q: Can I filter earthquakes by intensity?
A: Currently, filtering by magnitude is supported. Intensity filtering is planned for future versions.

### 🔧 Troubleshooting Questions

#### Q: The application is slow or unresponsive
A: Try reducing the historical data range, clearing the cache, or lowering the rendering quality in settings.

#### Q: Some earthquakes are not showing up
A: Check your filter settings and ensure the magnitude and time range include the earthquakes you're looking for.

#### Q: The 3D view is black or not working
A: This usually indicates a graphics driver issue. Try updating your graphics drivers or disabling hardware acceleration.

### 📱 Platform Questions

#### Q: Is there a mobile version?
A: Currently, this is a desktop application only. Mobile versions are under consideration.

#### Q: Which operating systems are supported?
A: Windows 10+, macOS 10.14+, and Linux (Ubuntu 18.04+) are officially supported.

#### Q: Can I run this on older hardware?
A: The application requires modern graphics capabilities. Older integrated graphics may not provide optimal performance.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Japan Meteorological Agency (JMA)** for providing earthquake data
- **Natural Earth** for geographic datasets
- **Three.js community** for 3D graphics capabilities
- **Electron team** for the desktop framework
- **Contributors** who help improve this project

---

## 📞 Support

For technical support, bug reports, or feature requests, please:

1. **Check this wiki** for common solutions
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join discussions** in the project community

**Project Repository**: https://github.com/rize0528/Japan-Earthquake-3D-Viz

---

*Last Updated: December 2024*