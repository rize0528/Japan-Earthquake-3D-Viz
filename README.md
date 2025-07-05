# Japan Earthquake 3D Visualization

A comprehensive 3D visualization application for Japan Meteorological Agency (JMA) earthquake data, built with Electron and Three.js.

## ✨ Features

### 🌏 3D Visualization
- **Real-time 3D rendering** of earthquake data using Three.js
- **Accurate Japan coastline** from Natural Earth GeoJSON data (10m resolution)
- **Geographic coordinate alignment** between earthquake spheres, place names, and coastline
- **Interactive navigation cube** for intuitive camera orientation control
- **Color-coded earthquake spheres** (red for recent <12h, yellow for older events)
- **Magnitude-based sphere sizing** with configurable scaling

### 📊 Data Management
- **JMA earthquake data integration** with caching system
- **Advanced filtering** by region, magnitude range, and time period
- **Multi-language support** (Japanese/English) for all UI elements and place names
- **Real-time data updates** with automatic refresh capabilities
- **Historical data fetching** for extended analysis

### 🎛️ User Interface
- **Single-window tabbed interface** with multiple views:
  - Overview and welcome screen
  - Data table with sortable earthquake records
  - Interactive 3D visualization
  - Calendar view with activity heatmap
- **Comprehensive filter controls** with real-time application
- **Visual customization** (sphere size, transparency, place name scaling)
- **Bilingual place names** for major Japanese cities and regions

### 🔧 Technical Features
- **Electron framework** for cross-platform desktop application
- **Three.js WebGL rendering** for high-performance 3D graphics
- **IPC communication** between main and renderer processes
- **Local data caching** for offline functionality
- **Coordinate system transformations** for accurate geographic positioning
- **Memory-efficient rendering** with object pooling and cleanup

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Japan-Earthquake-3D-Viz.git
   cd Japan-Earthquake-3D-Viz
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

### Development

- **Run in development mode:**
  ```bash
  npm run dev
  ```

- **Build for production:**
  ```bash
  npm run build
  ```

## 📖 Usage

### Navigation
- **3D View Controls:**
  - Left mouse drag: Rotate camera
  - Scroll wheel: Zoom in/out
  - Right mouse drag: Pan view
  - Navigation cube: Click faces for orthogonal views

### Data Filtering
- **Region Filter:** Select specific Japanese regions or view all
- **Magnitude Range:** Adjust minimum and maximum magnitude thresholds
- **Time Period:** Use calendar view to focus on specific dates

### Customization
- **Language Toggle:** Switch between Japanese and English
- **Visual Settings:** Adjust sphere size and transparency
- **Place Name Scaling:** Modify label visibility and size

## 🗾 Geographic Coverage

The application covers the complete Japan archipelago including:

- **Main Islands:** Honshu, Hokkaido, Kyushu, Shikoku
- **Major Cities:** Tokyo, Osaka, Nagoya, Sapporo, Fukuoka, Sendai, Hiroshima
- **Island Chains:** Izu Islands, Ogasawara Islands, Tokara Islands, Okinawa
- **Sea Areas:** Pacific Ocean, Sea of Japan, Seto Inland Sea

## 🛠️ Technical Architecture

```
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.js    # Application entry point
│   │   └── terrain-utils.js # Geographic data processing
│   ├── renderer/       # Frontend application
│   │   ├── main.html   # Primary UI with 3D visualization
│   │   └── js/         # JavaScript modules
│   └── shared/         # Shared utilities
│       └── preload.js  # IPC bridge
```

### Key Technologies
- **Electron:** Cross-platform desktop framework
- **Three.js:** 3D graphics and WebGL rendering
- **Natural Earth:** High-quality geographic datasets
- **Axios & Cheerio:** Data fetching and parsing
- **Node.js:** Backend data processing

## 🌍 Data Sources

- **Earthquake Data:** Japan Meteorological Agency (JMA)
- **Coastline Data:** Natural Earth Vector (10m resolution)
- **Geographic Coordinates:** Real lat/lon for all place names and features

## 🔄 Coordinate Systems

The application uses a sophisticated coordinate transformation system:

- **GeoJSON Coastline:** Standard geographic projection
- **Earthquake Spheres:** Latitude-swapped coordinate system for proper visualization
- **Place Names:** Aligned with earthquake coordinate system using real geographic coordinates
- **Navigation Cube:** Reflects the earthquake coordinate system orientation

## 📈 Performance Optimizations

- **Object Pooling:** Efficient sphere creation and disposal
- **Geographic Filtering:** Only process data within Japan bounds
- **Level-of-Detail:** Automatic sphere clustering for overlapping earthquakes
- **Memory Management:** Proper cleanup of Three.js resources
- **Caching System:** Local storage of earthquake data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Guidelines
- Follow existing code style and conventions
- Test thoroughly across different earthquake datasets
- Ensure proper coordinate system alignment
- Maintain bilingual support for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Japan Meteorological Agency** for providing earthquake data
- **Natural Earth** for high-quality geographic datasets
- **Three.js community** for excellent 3D graphics capabilities
- **Electron team** for the cross-platform framework

## 📧 Contact

For questions, suggestions, or technical support, please open an issue on GitHub.

---

**Built with ❤️ for earthquake research and visualization in Japan**