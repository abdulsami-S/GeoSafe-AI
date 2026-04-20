// ==========================
// INIT MAP
// ==========================
var map = L.map('map', {
    zoomControl: true,
    preferCanvas: true   // 🔥 performance boost
}).setView([13.0827, 80.2707], 10);

// Fix background
map.getContainer().style.background = "#ddd";

// Tile Layer (optimized)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    updateWhenZooming: false,
    keepBuffer: 2,
    attribution: '© OpenStreetMap'
}).addTo(map);

let marker;
let circle;

// ==========================
// CLICK TO SELECT LOCATION
// ==========================
map.on('click', function (e) {
    document.getElementById("lat").value = e.latlng.lat.toFixed(6);
    document.getElementById("lon").value = e.latlng.lng.toFixed(6);
});

// ==========================
// GET LOCATION NAME
// ==========================
async function getLocationName(lat, lon) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        return data.display_name || "Unknown location";
    } catch {
        return "Location not found";
    }
}

// ==========================
// DISPLAY RESULT
// ==========================
function displayResult(data, locationName) {

    let riskColor = data.risk.toLowerCase();

    let govStatus = data.gov_land
        ? "⚠️ Restricted / Government Land"
        : "✅ Safe / Private Land";

    document.getElementById("result").innerHTML = `
        <h2 style="margin-bottom:20px;">📊 Land Analysis</h2>

        <div class="section">
            <div class="section-title">📍 Location</div>
            <div class="value">${locationName}</div>
        </div>

        <div class="section">
            <div class="section-title">🎯 Purpose</div>
            <div class="value">${data.purpose}</div>
        </div>

        <div class="section">
            <div class="section-title">📊 Risk Level</div>
            <div class="${riskColor}">${data.risk}</div>
        </div>

        <div class="section">
            <div class="section-title">🌍 Land Type</div>
            <div class="value">${data.land_type}</div>
        </div>

        <div class="section">
            <div class="section-title">🏔 Terrain</div>
            <div class="value">${data.terrain} (${data.elevation} m)</div>
        </div>

        ${data.purpose && data.purpose.toLowerCase() === "residential" ? `
        <div class="section">
            <div class="section-title">🏢 Buildings</div>
            <div class="value">${data.building_density}</div>
        </div>` : ""}

        <div class="section">
            <div class="section-title">🏛 Land Status</div>
            <div class="value">${govStatus}</div>
        </div>

        <div class="section">
            <div class="section-title">📌 Authority</div>
            <div class="value">${data.gov_type}</div>
        </div>

        <div class="section">
            <div class="section-title">🌐 5km Context</div>
            <div class="value" style="font-weight: 500; font-size: 14px; line-height: 1.6;">
               🌾 Farming: ${data.farm_pct}% &nbsp;&nbsp;
               🏠 Res: ${data.res_pct}% &nbsp;&nbsp;
               🏭 Ind: ${data.ind_pct}% <br>
               🌳 Forest: ${data.forest_pct}% &nbsp;&nbsp;
               💧 Water: ${data.water_pct}% &nbsp;&nbsp;
               ⬛ Other: ${data.other_pct}%
            </div>
        </div>

        <div class="section">
            <div class="section-title">🧠 AI Insight</div>
            <div class="value">${data.explanation}</div>
        </div>
    `;
}

// ==========================
// MAIN FUNCTION
// ==========================
async function checkLand() {

    const lat = document.getElementById("lat").value;
    const lon = document.getElementById("lon").value;
    const purpose = document.getElementById("purpose").value;

    if (!lat || !lon) return alert("Enter coordinates");
    if (!purpose) return alert("Select purpose");

    // Loading UI
    document.getElementById("result").innerHTML = `
        <h2>⏳ Analyzing Location...</h2>
        <p>AI is processing geographic data...</p>
    `;

    const locationName = await getLocationName(lat, lon);

    try {
        const res = await fetch("http://127.0.0.1:5000/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lon, purpose })
        });

        const data = await res.json();

        // Add purpose manually if backend missing
        data.purpose = purpose;

        displayResult(data, locationName);

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        // Smooth zoom
        map.flyTo([latitude, longitude], 13, { duration: 1.2 });

        if (marker) map.removeLayer(marker);
        if (circle) map.removeLayer(circle);

        // ==========================
        // COLOR LOGIC (IMPROVED 🔥)
        // ==========================
        let color = "green";

        if (data.risk === "High") color = "red";
        else if (data.risk === "Medium") color = "orange";

        // Override for govt land
        if (data.gov_land) color = "blue";

        // Override for road (highest priority)
        if (data.on_road || (data.gov_type && data.gov_type.toLowerCase().includes("road"))) {
            color = "black";
        }

        // ==========================
        // CIRCLE
        // ==========================
        circle = L.circle([latitude, longitude], {
            color: color,
            fillColor: color,
            fillOpacity: 0.25,
            radius: 5000   // 5km (matches backend)
        }).addTo(map);

        // ==========================
        // MARKER
        // ==========================
        let icon = L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        marker = L.marker([latitude, longitude], { icon })
            .addTo(map)
            .bindPopup(`<b>${data.risk}</b><br>${data.explanation}`)
            .openPopup();

        marker.bindTooltip("Selected Location", {
            direction: "top",
            offset: [0, -10]
        });

    } catch (err) {
        alert("Server error");
        console.error(err);
    }
}