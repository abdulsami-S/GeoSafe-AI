import geopandas as gpd
from shapely.geometry import Point
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import math
import rasterio

app = Flask(__name__)
CORS(app)

# =========================
# LOAD MODEL
# =========================
model = joblib.load("ML/model.pkl")

# =========================
# LOAD GIS DATA
# =========================
ocean = gpd.read_file("data/ne_10m_ocean.shp").to_crs(epsg=4326)
lakes = gpd.read_file("data/ne_10m_lakes.shp").to_crs(epsg=4326)
rivers = gpd.read_file("data/ne_10m_rivers_lake_centerlines.shp").to_crs(epsg=4326)
coast = gpd.read_file("data/ne_10m_coastline.shp").to_crs(epsg=4326)

# Optimize
ocean = ocean.simplify(0.01)
lakes = lakes.simplify(0.01)

# =========================
# LANDUSE
# =========================
landuse = gpd.read_file("data/gis_osm_landuse_a_free_1.shp").to_crs(epsg=4326)

residential = landuse[landuse["fclass"] == "residential"]
industrial = landuse[landuse["fclass"] == "industrial"]
farmland = landuse[landuse["fclass"] == "farmland"]
forest = landuse[landuse["fclass"] == "forest"]

# =========================
# SPATIAL INDEX
# =========================
residential_sindex = residential.sindex
industrial_sindex = industrial.sindex
farmland_sindex = farmland.sindex
forest_sindex = forest.sindex

rivers_sindex = rivers.sindex
lakes_sindex = lakes.sindex
ocean_sindex = ocean.sindex
coast_sindex = coast.sindex

# =========================
# HELPERS
# =========================
def check_area(gdf, sindex, point):
    possible = list(sindex.intersection(point.bounds))
    return gdf.iloc[possible].contains(point).any()

def fast_distance(gdf, sindex, point):
    try:
        possible = list(sindex.intersection(point.buffer(0.1).bounds))
        nearby = gdf.iloc[possible]

        if len(nearby) == 0:
            return 999

        return nearby.distance(point).min()
    except:
        return 999

# =========================
# BUILDINGS
# =========================
def get_buildings(lat, lon):
    try:
        buffer = 0.003 # ~300 meters, strictly matching the visual circle
        bbox = (lon-buffer, lat-buffer, lon+buffer, lat+buffer)

        buildings = gpd.read_file(
            "data/gis_osm_buildings_a_free_1.shp",
            bbox=bbox
        )

        return len(buildings)
    except:
        return 0

# =========================
# ROADS (FINAL FIXED VERSION)
# =========================
def get_roads_info(lat, lon):
    try:
        buffer = 0.01
        bbox = (lon-buffer, lat-buffer, lon+buffer, lat+buffer)

        roads = gpd.read_file(
            "data/gis_osm_roads_free_1.shp",
            bbox=bbox
        )

        if len(roads) == 0:
            return False, False, 0

        # Convert to meters (important fix)
        roads = roads.to_crs(epsg=3857)
        point = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326") \
                    .to_crs(epsg=3857).iloc[0]

        distances = roads.distance(point)
        min_dist = distances.min()

        on_road = min_dist < 10      # meters
        near_road = min_dist < 100   # meters

        return bool(on_road), bool(near_road), len(roads)

    except:
        return False, False, 0

# =========================
# ELEVATION
# =========================
ELEVATION_FOLDER = "data/elevation"
elevation_cache = {}

def get_tile(lat, lon):
    lat_floor = int(math.floor(lat))
    lon_floor = int(math.floor(lon))

    for f in os.listdir(ELEVATION_FOLDER):
        if f"n{lat_floor:02d}" in f and f"e{lon_floor:03d}" in f:
            return os.path.join(ELEVATION_FOLDER, f)
    return None

def get_elevation(lat, lon):
    key = (round(lat, 3), round(lon, 3))

    if key in elevation_cache:
        return elevation_cache[key]

    tile = get_tile(lat, lon)
    if tile is None:
        return 0

    try:
        with rasterio.open(tile) as src:
            val = float(list(src.sample([(lon, lat)]))[0][0])
            elevation_cache[key] = val
            return val
    except:
        return 0

def terrain_type(e):
    if e > 800:
        return "Mountain"
    elif e > 300:
        return "Hill"
    return "Plain"

# =========================
# NEIGHBORHOOD 5KM ANALYSIS
# =========================
def analyze_surroundings(lat, lon, radius_km=5):
    try:
        pt_4326 = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326")
        pt_3857 = pt_4326.to_crs(epsg=3857).iloc[0]
        
        buffer_3857 = pt_3857.buffer(radius_km * 1000)
        buffer_4326 = gpd.GeoSeries([buffer_3857], crs="EPSG:3857").to_crs(epsg=4326).iloc[0]
        total_area = buffer_3857.area 
        
        def get_area_pct(gdf, sindex):
            idx = list(sindex.intersection(buffer_4326.bounds))
            if not idx: return 0
            candidates = gdf.iloc[idx]
            intersected = candidates.intersection(buffer_4326)
            intersected = intersected[~intersected.is_empty]
            if len(intersected) == 0: return 0
            intersected_3857 = gpd.GeoSeries(intersected, crs="EPSG:4326").to_crs(epsg=3857)
            return (intersected_3857.area.sum() / total_area) * 100
            
        res_pct = round(get_area_pct(residential, residential_sindex), 1)
        ind_pct = round(get_area_pct(industrial, industrial_sindex), 1)
        farm_pct = round(get_area_pct(farmland, farmland_sindex), 1)
        
        return res_pct, ind_pct, farm_pct
    except Exception as e:
        print("Analysis Error:", e)
        return 0, 0, 0

# =========================
# API
# =========================
@app.route("/check", methods=["POST"])
def check():

    data = request.json

    lat = float(data["lat"])
    lon = float(data["lon"])
    purpose = data.get("purpose")

    if not purpose:
        return jsonify({"error": "Please select purpose"}), 400

    point = Point(lon, lat)

    # Spatial checks
    in_residential = check_area(residential, residential_sindex, point)
    in_industrial = check_area(industrial, industrial_sindex, point)
    in_farmland = check_area(farmland, farmland_sindex, point)
    in_forest = check_area(forest, forest_sindex, point)

    in_ocean = ocean.contains(point).any()
    in_lake = lakes.contains(point).any()

    # Distances
    dist_river = fast_distance(rivers, rivers_sindex, point)
    dist_lake = fast_distance(lakes, lakes_sindex, point)
    dist_ocean = fast_distance(ocean, ocean_sindex, point)
    dist_forest = fast_distance(forest, forest_sindex, point)

    near_river = dist_river < 0.01
    near_coast = fast_distance(coast, coast_sindex, point) < 0.01

    # Features
    building_density = get_buildings(lat, lon)
    on_road, near_road, road_count = get_roads_info(lat, lon)
    elevation = get_elevation(lat, lon)
    terrain = terrain_type(elevation)

    slope = elevation * 0.1

    # ML
    features = [[
        dist_river, 
        dist_lake, 
        dist_ocean, 
        dist_forest, 
        elevation, 
        slope
    ]]
    risk_map = {0: "Low", 1: "Medium", 2: "High"}
    risk = risk_map.get(int(model.predict(features)[0]), "Medium")

    # Land type
    if in_residential:
        land_type = "Residential"
    elif in_industrial:
        land_type = "Industrial"
    elif in_farmland:
        land_type = "Farmland"
    elif in_forest:
        land_type = "Forest"
    else:
        land_type = "Urban" if building_density > 500 else "Rural"

    # Government logic
    gov_land = False
    gov_type = "Private"

    if on_road:
        gov_land = True
        gov_type = "Public Road Infrastructure"
    elif in_forest:
        gov_land = True
        gov_type = "Forest Protected Land"
    elif in_ocean or in_lake:
        gov_land = True
        gov_type = "Water Body"
    elif near_river:
        gov_land = True
        gov_type = "River Buffer Zone"
    elif near_coast:
        gov_land = True
        gov_type = "Coastal Zone"
        
    # Strict Risk Override for Government / Restricted Land
    if gov_land and purpose.lower() == "residential":
        risk = "High"

    # Neighborhood Context Calculation
    res_pct, ind_pct, farm_pct = analyze_surroundings(lat, lon, 5)

    surroundings_map = {"Residential": res_pct, "Industrial": ind_pct, "Farming": farm_pct}
    dominant_surround = max(surroundings_map, key=surroundings_map.get)
    max_pct = surroundings_map[dominant_surround]
    
    if max_pct == 0:
        dominant_surround = "Undeveloped / Open"
        
    ownership_status = "Government/Restricted Land" if gov_land else "Private Record"
    if on_road:
        ownership_status = "Public Road Infrastructure"

    # Dynamic Explanation
    explanation = f"Ownership: {ownership_status}. "

    if purpose.lower() == "general":
        explanation += f"Based on surroundings, this land is best suited for {dominant_surround} development. "
    else:
        target_pct = surroundings_map.get(purpose.title(), 0)
        if target_pct > 5 or land_type == purpose.title():
            explanation += f"Suitable for {purpose} usage. Surrounding area implies compatibility. "
        else:
            explanation += f"May not be ideal for {purpose} based on surroundings. The dominant surrounding sector is {dominant_surround}. "
    
    if on_road:
        explanation += "Warning: Exact location clashes directly with public road infrastructure. "
    elif gov_land:
        explanation += f"Warning: Exact location is restricted ({gov_type})."

    # Response
    return jsonify({
        "risk": risk,
        "purpose": purpose,
        "land_type": land_type,
        "terrain": terrain,
        "elevation": round(elevation, 2),
        "building_density": building_density,
        "res_pct": res_pct,
        "ind_pct": ind_pct,
        "farm_pct": farm_pct,
        "ownership": ownership_status,
        "on_road": on_road,
        "near_road": near_road,
        "nearby_roads_count": road_count,
        "gov_land": gov_land,
        "gov_type": gov_type,
        "explanation": explanation
    })

# =========================
# RUN
# =========================
if __name__ == "__main__":
    app.run(debug=True)