let waterLayer, forestLayer, lakeLayer;
var map = L.map('map').setView([13.0827, 80.2707], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker;

// ==========================
// DISPLAY RESULT
// ==========================
function displayResult(data, locationName) {
    let resultDiv = document.getElementById("result");

    let envFlags = data.environmental_flags.length > 0 
        ? data.environmental_flags.join(", ") 
        : "None";

    let legalFlags = data.legal_flags.length > 0 
        ? data.legal_flags.join(", ") 
        : "None";

    let riskClass = data.risk.toLowerCase();

    resultDiv.innerHTML = `
        <h3>📊 Analysis Result</h3>

        <p><span class="label">📍 Location:</span><br>
        ${locationName}
        </p>

        <p><span class="label">📊 Risk Level:</span><br>
        <span class="${riskClass}">${data.risk}</span></p>

        <p><span class="label">🌱 Land Info:</span><br>
        ${data.explanation}</p>

        <p><span class="label">⚠️ Environmental Flags:</span><br>
        ${envFlags}</p>

        <p><span class="label">🏛️ Legal Flags:</span><br>
        ${legalFlags}</p>
    `;
}

// ==========================
// MAIN FUNCTION
// ==========================
async function getLocationName(lat, lon) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );

        const data = await res.json();

        return data.display_name || "Unknown location";

    } catch (error) {
        console.error("Geocoding error:", error);
        return "Location not found";
    }
}


async function checkLand() {
    const lat = document.getElementById("lat").value;
    const lon = document.getElementById("lon").value;
    const locationName = await getLocationName(lat, lon);

    if (!lat || !lon) {
        alert("Enter coordinates");
        return;
    }

    document.getElementById("result").innerHTML = "⏳ Checking...";

    try {
        const res = await fetch("http://127.0.0.1:5000/check", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({lat, lon})
        });

        const data = await res.json();

        displayResult(data, locationName);

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        map.setView([latitude, longitude], 13);

        if (marker) map.removeLayer(marker);

        // 🔥 Dynamic marker color
        let color = "green";
        if (data.risk === "High") color = "red";
        else if (data.risk === "Medium") color = "orange";

        let icon = L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        marker = L.marker([latitude, longitude], { icon }).addTo(map);

        marker.bindPopup(
            `<b>${data.risk}</b><br>${data.explanation}`
        ).openPopup();

    } catch (err) {
        alert("Server error");
        console.error(err);
    }
}

// ==========================
// LOAD GIS LAYERS
// ==========================
async function loadLayers() {

    // 🌊 Ocean (CUSTOM COLOR)
    const ocean = await fetch("http://127.0.0.1:5000/layers/water").then(r => r.json());

    waterLayer = L.geoJSON(ocean, {
        style: {
            color: "#7cc0cf",   // ✅ YOUR COLOR
            fillColor: "#7cc0cf",
            weight: 1,
            fillOpacity: 0.5
        }
    }).addTo(map);

    // 🟦 Lakes
    const lakes = await fetch("http://127.0.0.1:5000/layers/lakes").then(r => r.json());

    lakeLayer = L.geoJSON(lakes, {
        style: {
            color: "#4da6ff",
            fillColor: "#4da6ff",
            weight: 1,
            fillOpacity: 0.6
        }
    }).addTo(map);

    // 🌳 Forest
    const forest = await fetch("http://127.0.0.1:5000/layers/forest").then(r => r.json());

    forestLayer = L.geoJSON(forest, {
        style: {
            color: "green",
            fillColor: "green",
            weight: 1,
            fillOpacity: 0.4
        }
    }).addTo(map);
}

loadLayers();