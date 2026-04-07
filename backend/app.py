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
# LOAD GLOBAL DATA
# =========================
land = gpd.read_file("data/ne_10m_land.shp").to_crs(epsg=4326)
ocean = gpd.read_file("data/ne_10m_ocean.shp").to_crs(epsg=4326)
lakes = gpd.read_file("data/ne_10m_lakes.shp").to_crs(epsg=4326)
rivers = gpd.read_file("data/ne_10m_rivers_lake_centerlines.shp").to_crs(epsg=4326)
coast = gpd.read_file("data/ne_10m_coastline.shp").to_crs(epsg=4326)
islands = gpd.read_file("data/ne_10m_minor_islands.shp").to_crs(epsg=4326)

# =========================
# LOAD OSM FOREST
# =========================
landuse = gpd.read_file("data/gis_osm_landuse_a_free_1.shp")
forest = landuse[landuse["fclass"] == "forest"].to_crs(epsg=4326)

# =========================
# LOAD GOVT LAND (OPTIONAL)
# =========================
try:
    govt = gpd.read_file("data/govt_land.geojson").to_crs(epsg=4326)
except:
    govt = None

# =========================
# HOME
# =========================
@app.route("/")
def home():
    return "GeoSafe AI Backend Running ✅"

# =========================
# SEND GEOJSON DATA
# =========================
@app.route("/layers/water")
def get_water():
    return ocean.to_json()

@app.route("/layers/lakes")
def get_lakes():
    return lakes.to_json()

@app.route("/layers/forest")
def get_forest():
    return forest.to_json()
    
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

    in_govt = False
    if govt is not None:
        in_govt = govt.contains(point).any()

    # Distance checks
    near_river = rivers.distance(point).min() < 0.05 if len(rivers) > 0 else False
    near_coast = coast.distance(point).min() < 0.05 if len(coast) > 0 else False

    # =========================
    # DECISION LOGIC
    # =========================
    environmental_flags = []
    legal_flags = []

    # =========================
    # CORRECTED LOGIC
    # =========================

    if in_ocean:

        if near_coast:
            risk = "Medium"
            environmental_flags.append("Coastal zone")
            explanation = "This location is near coastline. It may be restricted without permission and can lead to legal issues or environmental risks."

        else:
            risk = "High"
            environmental_flags.append("Ocean")
            explanation = " This location is in the ocean. It is not usable land and may be restricted for any development or use."

    elif in_lake:
        risk = "High"
        environmental_flags.append("Lake")
        explanation = "This location is inside lake. It is a water body and may not be allowed for use."

    elif in_forest:
        risk = "High"
        environmental_flags.append("Forest zone")
        explanation = "This location is forest area(eco-sensitive area). It is protected for biodiversity and restricted for normal use."

    elif in_govt:
        risk = "High"
        legal_flags.append("Government restricted land")
        explanation = "This location is governmentland.Access or usage may require permissions or may be prohibited."

    elif near_river:
        risk = "Medium"
        environmental_flags.append("Near river")
        explanation = "This location is near a river. There may be risk due to water flow or flooding."

    elif in_island:
        risk = "Medium"
        environmental_flags.append("Island")
        explanation = "This location is on an island. Access and development may be limited or restricted and require permissions."

    elif on_land:
        risk = "Low"
        explanation = "This location is normal land and suitable for general use."

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