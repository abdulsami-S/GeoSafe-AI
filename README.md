# GeoSafe AI - Smart Land Safety Analyzer

GeoSafe AI is an advanced spatial intelligence tool that analyzes land for safety, environmental risks, and suitability using OpenStreetMap GIS data and Machine Learning. 

It evaluates a given coordinate against multiple factors like proximity to water bodies, forests, existing infrastructure, and elevation to determine an overall Risk Score (Low, Medium, High).

![Landing Page](/screenshots/background.jpg) *(Replace with actual screenshot)*

## Features
- **Spatial Analysis**: Checks surrounding areas (up to 5km) for residential, industrial, and farming zones.
- **Machine Learning**: Random Forest model trained on spatial data to predict land risk.
- **Dynamic Explanations**: Generates plain-English insights so anyone can understand the results.
- **Interactive Maps**: Powered by Leaflet and CartoDB Dark Matter tiles.

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion, Leaflet
- **Backend**: FastAPI, GeoPandas, Shapely, Scikit-Learn, Rasterio
- **Deployment**: Docker Compose

---

## 🚀 How to Run Locally

### Option 1: Using Docker (Recommended)
This is the easiest and most reliable way to run the project, as it automatically configures all the complex spatial libraries (GDAL) required by GeoPandas and Rasterio.

1. Ensure you have [Docker](https://www.docker.com/) and Docker Compose installed.
2. Clone the repository and navigate to the root directory.
3. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
4. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API Docs: `http://localhost:8000/docs`

### Option 2: Manual Setup

#### Backend (FastAPI)
You will need system-level spatial libraries installed (e.g., GDAL, GEOS) for GeoPandas to work. On Windows, it is highly recommended to use WSL or Anaconda.

```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Run the API
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend (Next.js)
```bash
cd frontend
# Install dependencies
npm install

# Run development server
npm run dev
```
Navigate to `http://localhost:3000`.

---

## 👥 The Team
- Abdul Sami
- Thrivikram
- Leela Yashwanth
- Mohammad Samiullah

## 📜 License
MIT License
