# 🌍 GeoSafe AI — Premium Land Intelligence Platform

> **Transforming Complex Spatial Data into Actionable Safety Insights.**

GeoSafe AI is a state-of-the-art spatial intelligence platform designed to evaluate land safety, environmental risks, and developmental suitability. By combining **OpenStreetMap (GIS) data**, **High-Resolution Elevation Models**, and **Machine Learning**, it provides users with a comprehensive "Risk Score" and plain-English explanations for any coordinate on Earth.

---

## 📊 System Workflows

### 🛡️ For Everyone (Non-Technical Flow)
*Understanding how GeoSafe AI helps you make safer decisions.*

```mermaid
graph TD
    A[📍 Pick a Location] --> B{🔍 AI Analysis}
    B --> C[🌊 Checks Water Risk]
    B --> D[🌲 Checks Forest Proximity]
    B --> E[🏗️ Checks Infrastructure]
    C & D & E --> F[📋 Simple Safety Report]
    F --> G[✅ Decision Made Easy]
```

### ⚙️ Under the Hood (Technical Pipeline)
*The architecture powering our spatial intelligence.*

```mermaid
sequenceDiagram
    participant User as 💻 Next.js Frontend
    participant API as ⚡ FastAPI Backend
    participant GIS as 🗺️ GeoPandas Engine
    participant ML as 🧠 Random Forest Model

    User->>API: POST /check (Lat, Lon)
    API->>GIS: Fetch OSM & Elevation Data
    GIS->>GIS: Spatial Buffer & Join Operations
    GIS->>API: Calculated Features (Distances, Pct)
    API->>ML: Run Inference
    ML->>API: Risk Score (Low/Med/High)
    API->>User: JSON Response + AI Reasoning
```

---

## ✨ Key Features

- **🎯 Precision Analysis**: Evaluates land against multiple layers (Water, Roads, Forests, Industrial zones).
- **🧠 ML-Powered Risk Scoring**: Uses a Random Forest classifier trained on thousands of spatial data points.
- **⛰️ Terrain Awareness**: Integrates elevation data to determine if a site is a Plain, Hill, or Mountain.
- **🛰️ Real-Time OSM Integration**: Live extraction of building density and road networks.
- **📝 Human-Centric Insights**: Automatically generates clear explanations (e.g., *"Suitable for residential use, but close to a flood zone"*).

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-000?style=flat&logo=next.js) | High-performance dashboard |
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white) | Async AI & GIS API |
| **Spatial** | ![GeoPandas](https://img.shields.io/badge/GeoPandas-152126?style=flat&logo=pandas&logoColor=white) | Vector data processing |
| **ML Engine** | ![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-F7931E?style=flat&logo=scikit-learn&logoColor=white) | Risk prediction model |
| **Mapping** | ![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat&logo=leaflet&logoColor=white) | Interactive map UI |

---

## 🚀 Getting Started

### The Quick Start (Windows)
We've automated the setup for you. Just run:
```powershell
.\start.bat
```
*This will automatically install dependencies and launch both the backend (Port 8000) and frontend (Port 3000).*

### Manual Setup

#### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

#### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 Project Structure

```text
GeoSafe-AI/
├── 📂 backend/           # FastAPI, ML Models, GIS Logic
│   ├── 📂 ML/            # Trained models & training scripts
│   ├── 📂 data/          # GeoJSON/Shapefiles (GIS data)
│   └── app.py            # Main API Entry
├── 📂 frontend/          # Next.js 14 Application
│   ├── 📂 src/app/       # Routes & Pages
│   └── 📂 src/components/# UI Components (Maps, Navbar)
└── start.bat             # One-click launch script
```

---

## 👥 The Team
- **Abdul Sami**
- **Thrivikram**
- **Leela Yashwanth**
- **Mohammad Samiullah**

---
<p align="center">Built with ❤️ for a Safer Planet.</p>
