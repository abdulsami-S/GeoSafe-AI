import geopandas as gpd
from shapely.geometry import Point
import pandas as pd
import random
import rasterio
import os
import math


# =========================
# LOAD GIS DATA
# =========================
rivers = gpd.read_file("../data/ne_10m_rivers_lake_centerlines.shp").to_crs(epsg=3857)
lakes = gpd.read_file("../data/ne_10m_lakes.shp").to_crs(epsg=3857)
ocean = gpd.read_file("../data/ne_10m_ocean.shp").to_crs(epsg=3857)

landuse = gpd.read_file("../data/gis_osm_landuse_a_free_1.shp").to_crs(epsg=3857)

residential = landuse[landuse["fclass"] == "residential"]
industrial = landuse[landuse["fclass"] == "industrial"]
farmland = landuse[landuse["fclass"] == "farmland"]
forest = landuse[landuse["fclass"] == "forest"]

# =========================
# SPATIAL INDEX (FAST)
# =========================
rivers_sindex = rivers.sindex
lakes_sindex = lakes.sindex
ocean_sindex = ocean.sindex
forest_sindex = forest.sindex

# =========================
# FAST DISTANCE FUNCTION
# =========================
def fast_distance(gdf, sindex, point):
    try:
        idx = list(sindex.nearest(point.bounds, 1))
        nearest_geom = gdf.iloc[idx]
        return nearest_geom.distance(point).min() / 1000  # km
    except:
        return 999

# =========================
# LOAD ELEVATION
# =========================
# elevation_data = rasterio.open("../data/elevation.tif")

import os
import math

ELEVATION_FOLDER = "../data/elevation"

def get_tile(lat, lon):
    lat_floor = int(math.floor(lat))
    lon_floor = int(math.floor(lon))

    for f in os.listdir(ELEVATION_FOLDER):
        if f"n{lat_floor:02d}" in f and f"e{lon_floor:03d}" in f:
            return os.path.join(ELEVATION_FOLDER, f)
    return None

def get_elevation(lat, lon):
    tile = get_tile(lat, lon)

    if tile is None:
        return 0

    try:
        with rasterio.open(tile) as src:
            return float(list(src.sample([(lon, lat)]))[0][0])
    except:
        return 0

# =========================
# GENERATE DATA
# =========================
data = []

for i in range(6000):   # bigger dataset

    lat = random.uniform(8, 20)
    lon = random.uniform(70, 80)

    point = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs(epsg=3857).iloc[0]

    # Distances
    dist_river = fast_distance(rivers, rivers_sindex, point)
    dist_lake = fast_distance(lakes, lakes_sindex, point)
    dist_ocean = fast_distance(ocean, ocean_sindex, point)
    dist_forest = fast_distance(forest, forest_sindex, point)

    elevation = get_elevation(lat, lon)

    # Terrain classification
    if elevation > 800:
        terrain = 2  # mountain
    elif elevation > 300:
        terrain = 1  # hill
    else:
        terrain = 0  # plain

    # =========================
    # SMART RISK LABELING
    # =========================
    score = 0

    if dist_ocean < 0.5:
        score += 3
    if dist_lake < 0.3:
        score += 2
    if dist_river < 1:
        score += 2
    if dist_forest < 0.2:
        score += 2
    if elevation > 800:
        score += 2

    # Convert score → class
    if score >= 5:
        risk = 2
    elif score >= 2:
        risk = 1
    else:
        risk = 0

    # Add noise (important)
    if random.random() < 0.1:
        risk = random.choice([0, 1, 2])

    data.append([
        dist_river,
        dist_lake,
        dist_ocean,
        dist_forest,
        elevation,
        terrain,
        risk
    ])

# =========================
# SAVE
# =========================
df = pd.DataFrame(data, columns=[
    "dist_river",
    "dist_lake",
    "dist_ocean",
    "dist_forest",
    "elevation",
    "terrain",
    "risk"
])

df.to_csv("big_data.csv", index=False)

print("✅ Dataset created successfully!")