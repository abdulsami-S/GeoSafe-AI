import geopandas as gpd
from shapely.geometry import Point
from flask import Flask, request, jsonify
from flask_cors import CORS

# =========================
# INIT
# =========================
app = Flask(__name__)
CORS(app)

# =========================
# LOAD GLOBAL DATA (Natural Earth)
# =========================
land = gpd.read_file("data/ne_10m_land.shp").to_crs(epsg=4326)
ocean = gpd.read_file("data/ne_10m_ocean.shp").to_crs(epsg=4326)
lakes = gpd.read_file("data/ne_10m_lakes.shp").to_crs(epsg=4326)
rivers = gpd.read_file("data/ne_10m_rivers_lake_centerlines.shp").to_crs(epsg=4326)
coast = gpd.read_file("data/ne_10m_coastline.shp").to_crs(epsg=4326)
islands = gpd.read_file("data/ne_10m_minor_islands.shp").to_crs(epsg=4326)

# =========================
# LOAD INDIA FOREST (OSM)
# =========================
landuse = gpd.read_file("data/gis_osm_landuse_a_free_1.shp")
forest = landuse[landuse["fclass"] == "forest"]
forest = forest.to_crs(epsg=4326)

# =========================
# HOME
# =========================
@app.route("/")
def home():
    return "GeoSafe AI Backend Running ✅"

# =========================
# MAIN API
# =========================
@app.route("/check", methods=["POST"])
def check_land():
    data = request.json

    lat = float(data["lat"])
    lon = float(data["lon"])

    point = Point(lon, lat)

    # =========================
    # SPATIAL CHECKS
    # =========================
    in_ocean = ocean.contains(point).any()
    in_lake = lakes.contains(point).any()
    in_island = islands.contains(point).any()
    on_land = land.contains(point).any()
    in_forest = forest.contains(point).any()

    # Distance checks
    near_river = rivers.distance(point).min() < 0.05 if len(rivers) > 0 else False
    near_coast = coast.distance(point).min() < 0.05 if len(coast) > 0 else False

    # =========================
    # DECISION LOGIC
    # =========================
    environmental_flags = []
    legal_flags = []  # kept for structure

    if in_ocean:
        risk = "High"
        environmental_flags.append("Ocean")
        explanation = "Location is in ocean (not usable land)"

    elif in_lake:
        risk = "High"
        environmental_flags.append("Lake")
        explanation = "Location is inside lake"

    elif in_forest:
        risk = "High"
        environmental_flags.append("Forest zone")
        explanation = "Location is inside forest (eco-sensitive area)"

    elif near_river:
        risk = "Medium"
        environmental_flags.append("Near river")
        explanation = "Location is near river (flood risk)"

    elif near_coast:
        risk = "Medium"
        environmental_flags.append("Coastal zone")
        explanation = "Location is near coastline (erosion/flood risk)"

    elif in_island:
        risk = "Medium"
        environmental_flags.append("Island")
        explanation = "Location is on island"

    elif on_land:
        risk = "Low"
        explanation = "Safe land"

    else:
        risk = "Medium"
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
        "explanation": explanation
    })

# =========================
# RUN
# =========================
if __name__ == "__main__":
    app.run(debug=True)