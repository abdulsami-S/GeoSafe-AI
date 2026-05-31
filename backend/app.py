import geopandas as gpd
from shapely.geometry import Point
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os
import math
import rasterio
import asyncio
from functools import partial

app = FastAPI(title="GeoSafe AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CheckRequest(BaseModel):
    lat: float
    lon: float
    purpose: str = ""

# =============================================================================
# PERF 2 — IN-MEMORY RESULT CACHE
# =============================================================================
# Keys   : (lat_rounded_3dp, lon_rounded_3dp, purpose_lower)
# ~111 m spatial precision — same parcel won't differ between queries.
# Max 512 entries; oldest entry evicted when limit is reached (Python 3.7+
# dicts maintain insertion order so next(iter(…)) gives the FIFO entry).
# =============================================================================
_result_cache: dict = {}
_CACHE_MAX = 512

def _cache_key(lat: float, lon: float, purpose: str) -> tuple:
    return (round(lat, 3), round(lon, 3), purpose.strip().lower())

# =============================================================================
# LOAD MODEL
# =============================================================================
model = joblib.load(r"D:\GeoSafe-AI\backend\ML\model.pkl")

# =============================================================================
# PERF 1 — STARTUP GIS SHAPEFILE LOADING (natural earth layers)
# =============================================================================
# WHY: gpd.read_file() is expensive — it involves disk I/O, GDAL parsing,
# and CRS projection. Loading every shapefile ONCE at process startup means
# zero I/O for all subsequent requests. The GeoDataFrames live in RAM for
# the entire lifetime of the server process.
#
# All layers are projected to EPSG:4326 here so per-request code never has
# to reproject the full dataset — only tiny candidate subsets are reprojected
# in fast_distance().
# =============================================================================
print("[startup] Loading natural-earth layers…")
DATA_DIR = r"D:\GeoSafe-AI\backend\data"
ocean  = gpd.read_file(os.path.join(DATA_DIR, "ne_10m_ocean.shp")).to_crs(epsg=4326)
lakes  = gpd.read_file(os.path.join(DATA_DIR, "ne_10m_lakes.shp")).to_crs(epsg=4326)
rivers = gpd.read_file(os.path.join(DATA_DIR, "ne_10m_rivers_lake_centerlines.shp")).to_crs(epsg=4326)
coast  = gpd.read_file(os.path.join(DATA_DIR, "ne_10m_coastline.shp")).to_crs(epsg=4326)

# .simplify() on the geometry column only — preserves CRS + all attribute
# columns on the GeoDataFrame (assigning to the full frame would drop them).
ocean.geometry = ocean.geometry.simplify(0.01)
lakes.geometry = lakes.geometry.simplify(0.01)

# =============================================================================
# REGION BOUNDING BOX — limits in-memory data to the target area
# =============================================================================
# Loading entire India-wide shapefiles (~7M buildings, ~3M roads) exhausts RAM.
# We clip to a generous bbox around Telangana + surrounding states.
# Expand REGION_BBOX if queries from other regions are needed.
# Format: (min_lon, min_lat, max_lon, max_lat)
# =============================================================================
REGION_BBOX = (72.0, 8.0, 88.0, 28.0)   # covers all of peninsular + central India

# =============================================================================
# LANDUSE — loaded once at startup (region filtered)
# =============================================================================
print("[startup] Loading landuse layer…")
landuse     = gpd.read_file(
    os.path.join(DATA_DIR, "gis_osm_landuse_a_free_1.shp"),
    bbox=REGION_BBOX
).to_crs(epsg=4326)
residential = landuse[landuse["fclass"] == "residential"]
industrial  = landuse[landuse["fclass"] == "industrial"]
farmland    = landuse[landuse["fclass"] == "farmland"]
forest      = landuse[landuse["fclass"] == "forest"]

# =============================================================================
# BUILDINGS & ROADS — paths only (loaded per-request with tight bbox)
# =============================================================================
# Loading ~7M buildings + ~3M roads for all of India exhausts system RAM.
# Instead we use pyogrio's spatial-index-aware bbox read on every request:
# GDAL reads only the shapefile pages that intersect the small query bbox,
# typically <1 ms of I/O for a 1 km² area.  A tiny result cache avoids
# repeated reads for the exact same coordinate (e.g. repeated user clicks).
# =============================================================================
BUILDINGS_SHP = os.path.join(DATA_DIR, "gis_osm_buildings_a_free_1.shp")
ROADS_SHP     = os.path.join(DATA_DIR, "gis_osm_roads_free_1.shp")
print("[startup] Buildings & roads will be read on-demand (per-request bbox).")

# =============================================================================
# PERF 3 (VERIFY) — R-TREE INDEXES FOR PRELOADED SPATIAL LAYERS
# =============================================================================
residential_sindex = residential.sindex
industrial_sindex  = industrial.sindex
farmland_sindex    = farmland.sindex
forest_sindex      = forest.sindex
rivers_sindex      = rivers.sindex
lakes_sindex       = lakes.sindex
ocean_sindex       = ocean.sindex
coast_sindex       = coast.sindex
print("[startup] All R-tree indexes ready.")

# =============================================================================
# HELPERS — each uses an R-tree pre-filter before exact geometry tests
# =============================================================================
def check_area(gdf, sindex, point):
    """
    Point-in-polygon with R-tree pre-filter.

    sindex.intersection(bounds) returns the subset of row indices whose
    bounding boxes overlap the query point — O(log n). Only those candidates
    undergo the exact .contains() test — O(k) where k << n.
    """
    idx = list(sindex.intersection(point.bounds))
    if not idx:
        return False
    return gdf.iloc[idx].contains(point).any()


def fast_distance(gdf, sindex, point):
    """
    Nearest-geometry distance with R-tree pre-filter.

    A 0.1° (~11 km) buffer bounding box is used to query the R-tree so only
    nearby geometries are reprojected and measured.
    """
    try:
        idx = list(sindex.intersection(point.buffer(0.1).bounds))
        if not idx:
            return 999.0

        nearby      = gdf.iloc[idx]
        point_proj  = gpd.GeoSeries([point], crs="EPSG:4326").to_crs(epsg=3857).iloc[0]
        nearby_proj = nearby.to_crs(epsg=3857)
        return nearby_proj.distance(point_proj).min() / 1000.0
    except Exception:
        return 999.0


# =============================================================================
# BUILDINGS — per-request bbox disk read
# =============================================================================
def get_buildings(lat: float, lon: float) -> int:
    """
    Count buildings within ~300 m by reading only the local bbox from disk.
    pyogrio uses the shapefile's .shx spatial index so only matching pages
    are read — typically < 5 ms for a 600 m × 600 m window.
    """
    try:
        buffer = 0.003  # ≈ 300 m in decimal degrees
        bbox   = (lon - buffer, lat - buffer, lon + buffer, lat + buffer)
        gdf    = gpd.read_file(BUILDINGS_SHP, bbox=bbox)
        return len(gdf)
    except Exception:
        return 0


# =============================================================================
# ROADS — per-request bbox disk read
# =============================================================================
_ROAD_CLASSES = {"primary", "secondary", "residential", "tertiary"}

def get_roads_info(lat: float, lon: float):
    """
    Find roads within ~500 m by reading only the local bbox from disk.
    """
    try:
        buffer = 0.005  # ≈ 500 m in decimal degrees
        bbox   = (lon - buffer, lat - buffer, lon + buffer, lat + buffer)
        gdf    = gpd.read_file(ROADS_SHP, bbox=bbox)

        if gdf.empty:
            return False, False, 0

        gdf = gdf[gdf["fclass"].isin(_ROAD_CLASSES)]
        if gdf.empty:
            return False, False, 0

        gdf          = gdf.to_crs(epsg=3857)
        point_proj   = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326") \
                           .to_crs(epsg=3857).iloc[0]
        min_dist     = gdf.distance(point_proj).min()
        on_road      = min_dist < 10
        near_road    = min_dist < 100

        return bool(on_road), bool(near_road), len(gdf)
    except Exception:
        return False, False, 0


# =============================================================================
# ELEVATION — per-tile open + in-memory value cache (already optimised)
# =============================================================================
ELEVATION_FOLDER = r"D:\GeoSafe-AI\backend\data\elevation"
elevation_cache: dict = {}

def get_tile(lat, lon):
    lat_floor  = int(math.floor(abs(lat)))
    lon_floor  = int(math.floor(abs(lon)))
    lat_prefix = "n" if lat >= 0 else "s"
    lon_prefix = "e" if lon >= 0 else "w"

    for f in os.listdir(ELEVATION_FOLDER):
        f_lower = f.lower()
        if (f"{lat_prefix}{lat_floor:02d}" in f_lower
                and f"{lon_prefix}{lon_floor:03d}" in f_lower):
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
    except Exception:
        return 0

def terrain_type(e):
    if e > 800: return "Mountain"
    if e > 300: return "Hill"
    return "Plain"


# =============================================================================
# SURROUNDINGS — fully R-tree indexed via calc()
# =============================================================================
def analyze_surroundings(lat, lon, radius_km=5):
    try:
        pt_4326    = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326")
        pt_3857    = pt_4326.to_crs(epsg=3857).iloc[0]
        buf_3857   = pt_3857.buffer(radius_km * 1000)
        buf_4326   = gpd.GeoSeries([buf_3857], crs="EPSG:3857").to_crs(epsg=4326).iloc[0]
        total_area = buf_3857.area

        def calc(gdf, sindex):
            idx = list(sindex.intersection(buf_4326.bounds))  # R-tree filter
            if not idx:
                return 0
            candidates = gdf.iloc[idx]
            inter = candidates.intersection(buf_4326)
            inter = inter[~inter.is_empty]
            if len(inter) == 0:
                return 0
            inter_3857 = gpd.GeoSeries(inter, crs="EPSG:4326").to_crs(epsg=3857)
            return round((inter_3857.area.sum() / total_area) * 100, 1)

        res_pct    = calc(residential, residential_sindex)
        ind_pct    = calc(industrial,  industrial_sindex)
        farm_pct   = calc(farmland,    farmland_sindex)
        forest_pct = calc(forest,      forest_sindex)
        water_pct  = round(calc(lakes, lakes_sindex) + calc(ocean, ocean_sindex), 1)

        used_pct  = round(res_pct + ind_pct + farm_pct + forest_pct + water_pct, 1)
        other_pct = round(max(0, 100.0 - used_pct), 1)

        return res_pct, ind_pct, farm_pct, forest_pct, water_pct, other_pct

    except Exception as e:
        print("Surroundings Error:", e)
        return 0, 0, 0, 0, 0, 100


# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================
@app.get("/health")
async def health():
    """Liveness probe — also reports runtime cache statistics."""
    return {
        "status": "ok",
        "cached_results":    len(_result_cache),
        "landuse_loaded":    len(landuse),
        "buildings_on_demand": True,
        "roads_on_demand":     True,
    }

@app.delete("/cache/clear")
async def clear_cache():
    """Wipe the in-memory result cache (useful during development)."""
    _result_cache.clear()
    return {"status": "cleared"}


# =============================================================================
# SYNC ANALYSIS WORKER
# =============================================================================
def _run_analysis(lat: float, lon: float, purpose: str) -> dict:
    """
    All GIS + ML work lives here — purely synchronous.
    Called via run_in_executor() so it runs in a thread-pool worker and does
    NOT block uvicorn's async event loop.
    """
    point = Point(lon, lat)

    # Containment checks — all R-tree indexed via check_area()
    in_residential = check_area(residential, residential_sindex, point)
    in_industrial  = check_area(industrial,  industrial_sindex,  point)
    in_farmland    = check_area(farmland,     farmland_sindex,    point)
    in_forest      = check_area(forest,       forest_sindex,      point)
    in_ocean       = check_area(ocean,        ocean_sindex,       point)
    in_lake        = check_area(lakes,        lakes_sindex,       point)

    # Distance queries — all R-tree indexed via fast_distance()
    dist_river  = fast_distance(rivers, rivers_sindex, point)
    dist_lake   = fast_distance(lakes,  lakes_sindex,  point)
    dist_ocean  = fast_distance(ocean,  ocean_sindex,  point)
    dist_forest = fast_distance(forest, forest_sindex, point)
    dist_coast  = fast_distance(coast,  coast_sindex,  point)

    near_river = dist_river < 1.0
    near_coast = dist_coast < 1.0

    # In-memory building/road lookups — PERF 3 (no disk I/O)
    building_density               = get_buildings(lat, lon)
    on_road, near_road, road_count = get_roads_info(lat, lon)

    elevation   = get_elevation(lat, lon)
    terrain     = terrain_type(elevation)
    terrain_val = 2 if elevation > 800 else (1 if elevation > 300 else 0)

    features = [[dist_river, dist_lake, dist_ocean, dist_forest, elevation, terrain_val]]
    risk     = ["Low", "Medium", "High"][int(model.predict(features)[0])]

    # Land type classification
    if in_residential:  land_type = "Residential"
    elif in_industrial: land_type = "Industrial"
    elif in_farmland:   land_type = "Farmland"
    elif in_forest:     land_type = "Forest"
    else:               land_type = "Urban" if building_density > 500 else "Rural"

    # Government / restricted land
    gov_land = False
    gov_type = "Private"
    if on_road:               gov_land, gov_type = True, "Road"
    elif in_forest:           gov_land, gov_type = True, "Forest"
    elif in_ocean or in_lake: gov_land, gov_type = True, "Water"
    elif near_river:          gov_land, gov_type = True, "River Zone"
    elif near_coast:          gov_land, gov_type = True, "Coastal Zone"

    if on_road or gov_land:
        risk = "High"

    # Surroundings breakdown
    res_pct, ind_pct, farm_pct, forest_pct, water_pct, other_pct = \
        analyze_surroundings(lat, lon)

    surroundings_map  = {
        "Residential": res_pct, "Industrial": ind_pct, "Farming": farm_pct,
        "Forest": forest_pct,   "Water": water_pct,    "Open/Unclassified": other_pct,
    }
    active_map        = {k: v for k, v in surroundings_map.items() if k != "Open/Unclassified"}
    dominant_surround = max(active_map, key=active_map.get)
    if active_map[dominant_surround] == 0:
        dominant_surround = "Undeveloped / Open"

    dev_type = (
        "conservation or natural preservation"
        if dominant_surround in ["Forest", "Water", "Undeveloped / Open"]
        else f"{dominant_surround.lower()} development"
    )

    explanation = (
        f"{land_type} land. Nearby → Residential:{res_pct}% "
        f"Industrial:{ind_pct}% Farming:{farm_pct}% "
        f"Forest:{forest_pct}% Water:{water_pct}% Other:{other_pct}%. "
    )

    if purpose.lower() == "general" or not purpose:
        explanation += f"Based on surroundings, this land is best suited for {dev_type}."
    else:
        target_pct = surroundings_map.get(purpose.title(), 0)
        if target_pct > 5 or land_type.lower() == purpose.lower():
            explanation += f"Suitable for {purpose} usage. Surrounding area implies compatibility."
        else:
            explanation += (
                f"May not be ideal for {purpose}. "
                f"The dominant surrounding sector is {dominant_surround}."
            )

    if on_road:
        explanation = "CRITICAL WARNING: Location is on public road infrastructure! " + explanation
    elif gov_land:
        explanation = f"CRITICAL WARNING: Location is restricted ({gov_type}). " + explanation

    return {
        "risk": risk, "purpose": purpose, "land_type": land_type,
        "terrain": terrain, "elevation": elevation,
        "building_density": building_density,
        "res_pct": res_pct, "ind_pct": ind_pct, "farm_pct": farm_pct,
        "forest_pct": forest_pct, "water_pct": water_pct, "other_pct": other_pct,
        "on_road": on_road, "near_road": near_road, "nearby_roads_count": road_count,
        "gov_land": gov_land, "gov_type": gov_type, "explanation": explanation,
    }


# =============================================================================
# /check — main analysis endpoint
# =============================================================================
@app.post("/check")
async def check(request_data: CheckRequest):
    lat     = request_data.lat
    lon     = request_data.lon
    purpose = request_data.purpose

    # ── PERF 2: Result cache ──────────────────────────────────────────────────
    # Round to 3 d.p. (~111 m).  Same parcel queried twice → instant return.
    # No GIS work, no thread-pool, no ML inference.
    key = _cache_key(lat, lon, purpose)
    if key in _result_cache:
        return _result_cache[key]

    # ── run_in_executor ───────────────────────────────────────────────────────
    # _run_analysis() is 100% synchronous (GeoPandas, Scikit-learn, Rasterio).
    # Calling it directly inside `async def` blocks uvicorn's event loop —
    # no other request can be served while GIS work is running.
    # run_in_executor() offloads it to a thread-pool worker so the loop stays
    # free and concurrent requests are handled normally.
    loop   = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, partial(_run_analysis, lat, lon, purpose))

    # FIFO eviction when cache is full
    if len(_result_cache) >= _CACHE_MAX:
        _result_cache.pop(next(iter(_result_cache)))
    _result_cache[key] = result

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)