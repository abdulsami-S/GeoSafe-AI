# 🌍 GeoSafe AI - Smart Land Analyzer

GeoSafe AI is an intelligent geospatial analysis system that evaluates land safety using GIS datasets and provides clear, explainable insights through an interactive map interface.

---

## 🚀 Features

- 📍 Accepts latitude & longitude input
- 🌍 Multi-layer spatial validation using GIS data
- 🌊 Detects ocean, lakes, rivers, and coastal zones
- 🌳 Identifies forest and eco-sensitive areas
- ⚠️ Highlights environmental and legal risks
- 🗺️ Interactive map with real-time overlays
- 📊 Clean and modern dashboard UI

---

## 🧠 How It Works

- Natural Earth dataset → land, ocean, lakes
- OSM data → forest regions
- GeoPandas + Shapely → spatial analysis
- Flask → backend API
- Leaflet.js → map visualization

---

## 📊 Risk Classification

| Risk Level | Meaning |
|-----------|--------|
| 🟢 Low | Safe land |
| 🟡 Medium | Moderate risk |
| 🔴 High | Unsafe / restricted |

---

## 🖥️ Tech Stack

- Python (Flask)
- GeoPandas
- Shapely
- JavaScript (Leaflet)
- HTML + CSS

---

## ▶️ How to Run

```bash
pip install flask geopandas shapely flask-cors
```

```bash
python app.py
```

Open `index.html` in browser

---

## 📸 Screenshots

### 🌍 Map View
<img src="frontend/screenshots/map.png" width="100%">

### 📊 Result Panel
<img src="frontend/screenshots/result.png" width="100%">

---

## 🎯 Key Highlights

- Real-time GIS analysis
- Explainable output
- Interactive visualization
- Clean UI

---

## 👨‍💻 Author

Abdul Sami

---

## ⭐ Star this repo if you like it!
