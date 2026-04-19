// ==========================
// INIT MAP
// ==========================
var map = L.map('map').setView([13.0827, 80.2707], 10);

// Fix white background
map.getContainer().style.background = "#ddd";

// ✅ STANDARD OPENSTREETMAP TILE LAYER
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
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

        ${data.purpose.toLowerCase() === "residential" ? `
        <div class="section">
            <div class="section-title">🏢 Buildings in Radius</div>
            <div class="value">${data.building_density}</div>
        </div>
        ` : ""}

        <div class="section">
            <div class="section-title">🏛 Land Status</div>
            <div class="value">${govStatus}</div>
        </div>

        <div class="section">
            <div class="section-title">📌 Authority</div>
            <div class="value">${data.gov_type}</div>
        </div>

        <div class="section">
            <div class="section-title">🌐 5km Surrounding Context</div>
            <div class="value" style="font-weight: 500; font-size: 14px; opacity: 0.95;">
               🌾 Farming: ${data.farm_pct}% <br>
               🏠 Residential: ${data.res_pct}% <br>
               🏭 Industrial: ${data.ind_pct}%
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

        displayResult(data, locationName);

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        map.flyTo([latitude, longitude], 12, { duration: 1.5 });

        if (marker) map.removeLayer(marker);
        if (circle) map.removeLayer(circle);

        // ==========================
        // COLOR LOGIC (Based strongly on Risk Level)
        // ==========================
        let color = "green";

        if (data.risk === "High") color = "red";
        else if (data.risk === "Medium") color = "orange";


        // ==========================
        // CIRCLE
        // ==========================
        circle = L.circle([latitude, longitude], {
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            radius: 5000
        }).addTo(map);

        // ==========================
        // MARKER
        // ==========================
        let icon = L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        marker = L.marker([latitude, longitude], { icon }).addTo(map)
            .bindPopup(`<b>${data.risk}</b><br>${data.explanation}`)
            .openPopup();

        marker.bindTooltip("Selected Location", {
            direction: "top"
        });

    } catch (err) {
        alert("Server error");
        console.error(err);
    }
}