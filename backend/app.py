import geopandas as gpd
from shapely.geometry import Point
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import rasterio

# =========================
# INIT
# =========================
app = Flask(__name__)
CORS(app)

# =========================
# LOAD ML MODEL
# =========================
model = joblib.load("ML/model.pkl")

# =========================
# LOAD GIS DATA (FIXED CRS)
# =========================
land = gpd.read_file("data/ne_10m_land.shp").to_crs(epsg=3857)
ocean = gpd.read_file("data/ne_10m_ocean.shp").to_crs(epsg=3857)
lakes = gpd.read_file("data/ne_10m_lakes.shp").to_crs(epsg=3857)
rivers = gpd.read_file("data/ne_10m_rivers_lake_centerlines.shp").to_crs(epsg=3857)
coast = gpd.read_file("data/ne_10m_coastline.shp").to_crs(epsg=3857)

# Forest
landuse = gpd.read_file("data/gis_osm_landuse_a_free_1.shp")
forest = landuse[landuse["fclass"] == "forest"].to_crs(epsg=3857)

# =========================
# LOAD ELEVATION
# =========================
elevation_data = rasterio.open("ML/data/elevation.tif")

def get_elevation(lat, lon):
    try:
        val = list(elevation_data.sample([(lon, lat)]))[0][0]
        return float(val)
    except:
        return 0

# =========================
# HOME
# =========================
@app.route("/")
def home():
    return "GeoSafe AI ML Backend Running 🚀"

# =========================
# MAIN API
# =========================
@app.route("/check", methods=["POST"])
def check_land():
    data = request.json

    lat = float(data["lat"])
    lon = float(data["lon"])

    # Convert to metric CRS
    point = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs(epsg=3857)
    point = point.iloc[0]

    # =========================
    # GIS FEATURES (REAL DISTANCE IN KM)
    # =========================
    dist_ocean = ocean.distance(point).min() / 1000
    dist_river = rivers.distance(point).min() / 1000
    dist_forest = forest.distance(point).min() / 1000
    dist_lake = lakes.distance(point).min() / 1000
    dist_coast = coast.distance(point).min() / 1000

    in_ocean = ocean.contains(point).any()
    in_lake = lakes.contains(point).any()
    in_forest = forest.contains(point).any()
    on_land = land.contains(point).any()

    # =========================
    # ML FEATURES (MATCH TRAINING)
    # =========================
    elevation = get_elevation(lat, lon)
    slope = abs(elevation - 200)

    features = np.array([[
        dist_river,
        dist_lake,
        dist_ocean,
        dist_forest,
        elevation,
        slope
    ]])

    # =========================
    # ML PREDICTION
    # =========================
    pred = model.predict(features)[0]

    if pred == 2:
        risk = "High"
    elif pred == 1:
        risk = "Medium"
    else:
        risk = "Low"

    # =========================
    # EXPLANATION (UNCHANGED)
    # =========================
    environmental_flags = []
    legal_flags = []

    if in_ocean:
        environmental_flags.append("Ocean")
        explanation = "This location is in the ocean. It is not usable land and may be restricted for any development or use."

    elif in_lake:
        environmental_flags.append("Lake")
        explanation = "This location is inside lake. It is a water body and may not be allowed for use."

    elif in_forest:
        environmental_flags.append("Forest zone")
        explanation = "This location is forest area (eco-sensitive area). It is protected for biodiversity and restricted for normal use."

    elif dist_coast < 2:
        environmental_flags.append("Coastal zone")
        explanation = "This location is near coastline. It may be restricted without permission and can lead to legal issues or environmental risks."

    elif dist_river < 1:
        environmental_flags.append("Near river")
        explanation = "This location is near a river. There may be risk due to water flow or flooding."

    elif on_land:
        explanation = "This location is normal land and suitable for general use."

    else:
        environmental_flags.append("Unknown terrain")
        explanation = "Unable to classify terrain"

    # =========================
    # RESPONSE
    # =========================
    return jsonify({
        "location": {"lat": lat, "lon": lon},
        "risk": risk,
        "environmental_flags": environmental_flags,
        "legal_flags": legal_flags,
        "explanation": explanation,
        "features": {
            "distance_to_river_km": round(dist_river, 2),
            "distance_to_lake_km": round(dist_lake, 2),
            "distance_to_ocean_km": round(dist_ocean, 2),
            "distance_to_forest_km": round(dist_forest, 2),
            "elevation": round(elevation, 2)
        }
    })

# =========================
# RUN
# =========================
if __name__ == "__main__":
    app.run(debug=True)