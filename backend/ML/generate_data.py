import geopandas as gpd
from shapely.geometry import Point
import pandas as pd
import random
import rasterio

# =========================
# LOAD GIS DATA
# =========================
rivers = gpd.read_file("../data/ne_10m_rivers_lake_centerlines.shp").to_crs(epsg=3857)
lakes = gpd.read_file("../data/ne_10m_lakes.shp").to_crs(epsg=3857)
ocean = gpd.read_file("../data/ne_10m_ocean.shp").to_crs(epsg=3857)

landuse = gpd.read_file("../data/gis_osm_landuse_a_free_1.shp")
forest = landuse[landuse["fclass"] == "forest"].to_crs(epsg=3857)

# =========================
# LOAD ELEVATION
# =========================
elevation_data = rasterio.open("data/elevation.tif")

def get_elevation(lat, lon):
    try:
        val = list(elevation_data.sample([(lon, lat)]))[0][0]
        return float(val)
    except:
        return 0

# =========================
# GENERATE DATA
# =========================
data = []

for i in range(3000):   # BIG DATASET

    lat = random.uniform(10, 20)
    lon = random.uniform(70, 80)

    point = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs(epsg=3857)
    point = point.iloc[0]

    # Distances (km)
    dist_river = rivers.distance(point).min() / 1000
    dist_lake = lakes.distance(point).min() / 1000
    dist_ocean = ocean.distance(point).min() / 1000
    dist_forest = forest.distance(point).min() / 1000

    elevation = get_elevation(lat, lon)

    # Extra feature
    slope = abs(elevation - random.uniform(0, 500))

    # =========================
    # REALISTIC RISK LOGIC
    # =========================
    if elevation < 50 and dist_river < 1:
        risk = 2   # High
    elif elevation < 100 or dist_river < 2:
        risk = 1   # Medium
    else:
        risk = 0   # Low

    # Add noise (IMPORTANT)
    if random.random() < 0.15:
        risk = random.choice([0, 1, 2])

    data.append([
        lat, lon, dist_river, dist_lake,
        dist_ocean, dist_forest, elevation, slope, risk
    ])

# =========================
# SAVE DATA
# =========================
df = pd.DataFrame(data, columns=[
    "lat", "lon", "dist_river", "dist_lake",
    "dist_ocean", "dist_forest", "elevation", "slope", "risk"
])

df.to_csv("big_data.csv", index=False)

print("Dataset created successfully!")