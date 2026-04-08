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
# CREATE SPATIAL INDEX (SPEED BOOST)
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
        return 999  # fallback

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

for i in range(4000):   # large dataset

    lat = random.uniform(10, 20)
    lon = random.uniform(70, 80)

    point = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326").to_crs(epsg=3857)
    point = point.iloc[0]

    # =========================
    # FAST DISTANCE CALCULATION
    # =========================
    dist_river = fast_distance(rivers, rivers_sindex, point)
    dist_lake = fast_distance(lakes, lakes_sindex, point)
    dist_ocean = fast_distance(ocean, ocean_sindex, point)
    dist_forest = fast_distance(forest, forest_sindex, point)

    elevation = get_elevation(lat, lon)

    # Extra feature
    slope = abs(elevation - random.uniform(0, 500))

    # =========================
    # IMPROVED RISK LABELING
    # =========================
    if dist_ocean < 0.5 or dist_lake < 0.3:
        risk = 2   # HIGH

    elif dist_river < 1 or elevation < 50:
        risk = 1   # MEDIUM

    else:
        risk = 0   # LOW

    # =========================
    # ADD NOISE (REAL ML BEHAVIOR)
    # =========================
    if random.random() < 0.10:
        risk = random.choice([0, 1, 2])

    data.append([
        lat, lon,
        dist_river, dist_lake,
        dist_ocean, dist_forest,
        elevation, slope,
        risk
    ])

# =========================
# SAVE DATA
# =========================
df = pd.DataFrame(data, columns=[
    "lat", "lon",
    "dist_river", "dist_lake",
    "dist_ocean", "dist_forest",
    "elevation", "slope",
    "risk"
])

df.to_csv("big_data.csv", index=False)

print("Dataset created successfully! ")