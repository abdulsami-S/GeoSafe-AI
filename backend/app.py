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
# OSM SHAPEFILE PATHS — all OSM layers are read per-request within SCAN_RADIUS
# =============================================================================
LANDUSE_SHP   = os.path.join(DATA_DIR, "gis_osm_landuse_a_free_1.shp")
BUILDINGS_SHP = os.path.join(DATA_DIR, "gis_osm_buildings_a_free_1.shp")
ROADS_SHP     = os.path.join(DATA_DIR, "gis_osm_roads_free_1.shp")

# =============================================================================
# SCAN RADIUS — single knob that controls how far around the query point
# every OSM layer is read.  Increase for wider context; decrease for speed.
# 1 degree ≈ 111 km at the equator.
# =============================================================================
SCAN_RADIUS_KM  = 10                      # kilometres to scan around the point
SCAN_RADIUS_DEG = SCAN_RADIUS_KM / 111.0  # converted to decimal degrees

print(f"[startup] All OSM layers will be scanned within {SCAN_RADIUS_KM} km of each query.")

# =============================================================================
# NATURAL EARTH — preloaded (global, tiny: ocean=2 features, lakes=1300, etc.)
# =============================================================================
rivers_sindex = rivers.sindex
lakes_sindex  = lakes.sindex
ocean_sindex  = ocean.sindex
coast_sindex  = coast.sindex
print("[startup] Natural-earth R-tree indexes ready. Server is UP.")

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
# LOCAL OSM LOADER — single function that reads ALL OSM layers for a point
# =============================================================================
_ROAD_CLASSES = {"primary", "secondary", "residential", "tertiary"}

def load_local_osm(lat: float, lon: float):
    """
    Read landuse, buildings, and roads from disk using a tight bbox of
    SCAN_RADIUS_DEG around the query point.  pyogrio uses the .shx spatial
    index so only the relevant shapefile pages are touched — typically
    10–50 ms total for all three layers on a local SSD/HDD.

    Returns: (loc_res, loc_ind, loc_farm, loc_forest,
              building_count, on_road, near_road, road_count)
    """
    bbox = (
        lon - SCAN_RADIUS_DEG, lat - SCAN_RADIUS_DEG,
        lon + SCAN_RADIUS_DEG, lat + SCAN_RADIUS_DEG,
    )
    point_geom = Point(lon, lat)

    # ── Landuse ──────────────────────────────────────────────────────────
    try:
        lu       = gpd.read_file(LANDUSE_SHP, bbox=bbox).to_crs(epsg=4326)
        loc_res  = lu[lu["fclass"] == "residential"]
        loc_ind  = lu[lu["fclass"] == "industrial"]
        loc_farm = lu[lu["fclass"] == "farmland"]
        loc_for  = lu[lu["fclass"] == "forest"]
    except Exception:
        empty = gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")
        loc_res = loc_ind = loc_farm = loc_for = empty

    # ── Buildings ────────────────────────────────────────────────────────
    # Tighter box: only 300 m radius for density count
    try:
        b_buf    = 0.003   # ≈ 300 m
        b_bbox   = (lon-b_buf, lat-b_buf, lon+b_buf, lat+b_buf)
        bld      = gpd.read_file(BUILDINGS_SHP, bbox=b_bbox)
        building_count = len(bld)
    except Exception:
        building_count = 0

    # ── Roads ────────────────────────────────────────────────────────────
    # 500 m radius for road proximity
    try:
        r_buf  = 0.005   # ≈ 500 m
        r_bbox = (lon-r_buf, lat-r_buf, lon+r_buf, lat+r_buf)
        rds    = gpd.read_file(ROADS_SHP, bbox=r_bbox)
        if rds.empty:
            on_road = near_road = False
            road_count = 0
        else:
            rds = rds[rds["fclass"].isin(_ROAD_CLASSES)]
            if rds.empty:
                on_road = near_road = False
                road_count = 0
            else:
                rds_proj   = rds.to_crs(epsg=3857)
                pt_proj    = gpd.GeoSeries([point_geom], crs="EPSG:4326").to_crs(epsg=3857).iloc[0]
                min_dist   = rds_proj.distance(pt_proj).min()
                on_road    = bool(min_dist < 10)
                near_road  = bool(min_dist < 100)
                road_count = len(rds)
    except Exception:
        on_road = near_road = False
        road_count = 0

    return loc_res, loc_ind, loc_farm, loc_for, building_count, on_road, near_road, road_count


# =============================================================================
# LOCAL CONTAINMENT CHECK — works on a small local GeoDataFrame
# =============================================================================
def local_in_area(gdf: gpd.GeoDataFrame, point) -> bool:
    """Point-in-polygon check on a small local GDF (no sindex needed)."""
    if gdf is None or gdf.empty:
        return False
    return bool(gdf.contains(point).any())


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
# SURROUNDINGS — uses the local GDFs already loaded by load_local_osm()
# =============================================================================
def analyze_surroundings(lat, lon, loc_res, loc_ind, loc_farm, loc_forest, radius_km=5):
    """
    Compute land-use percentage breakdown within radius_km of the point.
    Accepts locally-loaded GDFs so no extra disk I/O is needed.
    """
    try:
        pt_4326    = gpd.GeoSeries([Point(lon, lat)], crs="EPSG:4326")
        pt_3857    = pt_4326.to_crs(epsg=3857).iloc[0]
        buf_3857   = pt_3857.buffer(radius_km * 1000)
        buf_4326   = gpd.GeoSeries([buf_3857], crs="EPSG:3857").to_crs(epsg=4326).iloc[0]
        total_area = buf_3857.area

        def calc(gdf):
            """Intersect gdf with the buffer circle and compute area %."""
            if gdf is None or gdf.empty:
                return 0
            inter = gdf.intersection(buf_4326)
            inter = inter[~inter.is_empty]
            if inter.empty:
                return 0
            inter_3857 = gpd.GeoSeries(inter, crs="EPSG:4326").to_crs(epsg=3857)
            return round((inter_3857.area.sum() / total_area) * 100, 1)

        res_pct    = calc(loc_res)
        ind_pct    = calc(loc_ind)
        farm_pct   = calc(loc_farm)
        forest_pct = calc(loc_forest)
        # Water: use preloaded natural-earth lakes + ocean (already global & small)
        water_pct  = round(
            calc(lakes[lakes.intersects(buf_4326)]) +
            calc(ocean[ocean.intersects(buf_4326)]),
            1
        )

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
        "status":           "ok",
        "cached_results":   len(_result_cache),
        "scan_radius_km":   SCAN_RADIUS_KM,
        "osm_mode":         "per-request local bbox",
        "natural_earth":    "preloaded",
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

    Strategy: read ALL OSM data (landuse, buildings, roads) from a local
    SCAN_RADIUS_KM bbox around the query point.  Only Natural Earth layers
    (ocean, lakes, rivers, coast) are preloaded — they are globally tiny.
    """
    point = Point(lon, lat)

    # ── Single disk pass: load all OSM data within SCAN_RADIUS ───────────
    loc_res, loc_ind, loc_farm, loc_forest, \
    building_density, on_road, near_road, road_count = load_local_osm(lat, lon)

    # ── Containment checks (local landuse) ───────────────────────────────
    in_residential = local_in_area(loc_res,    point)
    in_industrial  = local_in_area(loc_ind,    point)
    in_farmland    = local_in_area(loc_farm,   point)
    in_forest      = local_in_area(loc_forest, point)

    # ── Containment checks (preloaded natural earth) ──────────────────────
    in_ocean = check_area(ocean, ocean_sindex, point)
    in_lake  = check_area(lakes, lakes_sindex, point)

    # ── Distance to natural features (preloaded, R-tree indexed) ─────────
    dist_river  = fast_distance(rivers, rivers_sindex, point)
    dist_lake   = fast_distance(lakes,  lakes_sindex,  point)
    dist_ocean  = fast_distance(ocean,  ocean_sindex,  point)
    dist_coast  = fast_distance(coast,  coast_sindex,  point)
    # Forest distance from local data
    dist_forest = fast_distance(loc_forest, loc_forest.sindex, point) \
                  if not loc_forest.empty else 999.0

    near_river = dist_river < 1.0
    near_coast = dist_coast < 1.0

    elevation   = get_elevation(lat, lon)
    terrain     = terrain_type(elevation)
    terrain_val = 2 if elevation > 800 else (1 if elevation > 300 else 0)

    features = [[dist_river, dist_lake, dist_ocean, dist_forest, elevation, terrain_val]]
    risk     = ["Low", "Medium", "High"][int(model.predict(features)[0])]

    # ── Land type classification ──────────────────────────────────────────
    if in_residential:  land_type = "Residential"
    elif in_industrial: land_type = "Industrial"
    elif in_farmland:   land_type = "Farmland"
    elif in_forest:     land_type = "Forest"
    else:               land_type = "Urban" if building_density > 500 else "Rural"

    # ── Government / restricted land ─────────────────────────────────────
    gov_land = False
    gov_type = "Private"
    if on_road:               gov_land, gov_type = True, "Road"
    elif in_forest:           gov_land, gov_type = True, "Forest"
    elif in_ocean or in_lake: gov_land, gov_type = True, "Water"
    elif near_river:          gov_land, gov_type = True, "River Zone"
    elif near_coast:          gov_land, gov_type = True, "Coastal Zone"

    if on_road or gov_land:
        risk = "High"

    # ── Surroundings breakdown (uses already-loaded local GDFs) ──────────
    res_pct, ind_pct, farm_pct, forest_pct, water_pct, other_pct = \
        analyze_surroundings(lat, lon, loc_res, loc_ind, loc_farm, loc_forest)

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