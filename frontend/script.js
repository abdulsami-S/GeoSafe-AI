// ==========================
// INIT MAP
// ==========================
let waterLayer, forestLayer, lakeLayer;
var map = L.map('map').setView([13.0827, 80.2707], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker;

// ==========================
// DISPLAY RESULT
// ==========================
function displayResult(data) {
    let resultDiv = document.getElementById("result");

    let envFlags = data.environmental_flags.length > 0 
        ? data.environmental_flags.join(", ") 
        : "None";

    let legalFlags = data.legal_flags.length > 0 
        ? data.legal_flags.join(", ") 
        : "None";

    let riskClass = "";
    if (data.risk === "Low") riskClass = "low";
    else if (data.risk === "Medium") riskClass = "medium";
    else if (data.risk === "High") riskClass = "high";

    resultDiv.innerHTML = `
    <h3>📊 Analysis Result</h3>

    <p><span class="label">📍 Location:</span> ${data.location.lat}, ${data.location.lon}</p>

    <p><span class="label">📊 Risk Level:</span> 
    <span class="${riskClass}">${data.risk}</span></p>

    <p><span class="label">🌱 Land Info:</span><br>
    ${data.explanation}</p>

    <p><span class="label">⚠️ Environmental Flags:</span> ${envFlags}</p>

    <p><span class="label">🏛️ Legal Flags:</span> ${legalFlags}</p>
`;
}

// ==========================
// MAIN FUNCTION
// ==========================
async function checkLand() {
    const lat = document.getElementById("lat").value;
    const lon = document.getElementById("lon").value;

    document.getElementById("result").innerHTML = "⏳ Checking location...";

    if (!lat || !lon) {
        alert("Please enter latitude and longitude");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                lat: lat,
                lon: lon
            })
        });

        const data = await response.json();

        displayResult(data);

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        map.setView([latitude, longitude], 13);

        if (marker) {
            map.removeLayer(marker);
        }

        // ==========================
        // COLOR BASED MARKER 🔥
        // ==========================
        let markerColor = "blue";

        if (data.risk === "High") markerColor = "red";
        else if (data.risk === "Medium") markerColor = "orange";
        else markerColor = "green";

        let icon = L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${markerColor}.png`,
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });

        marker = L.marker([latitude, longitude], { icon: icon }).addTo(map);

        marker.bindPopup(
            `<b>Risk:</b> ${data.risk}<br>
             <b>Info:</b> ${data.explanation}`
        ).openPopup();

    } catch (error) {
        alert("Error connecting to backend");
        console.error(error);
    }
}

// ==========================
// LOAD GIS LAYERS
// ==========================
async function loadLayers() {

    // 🔵 Ocean
    const oceanRes = await fetch("http://127.0.0.1:5000/layers/water");
    const oceanData = await oceanRes.json();

    waterLayer = L.geoJSON(oceanData, {
        style: {
            color: "blue",
            weight: 1,
            fillOpacity: 0.3
        }
    }).addTo(map);

    // 🔵 Lakes
    const lakeRes = await fetch("http://127.0.0.1:5000/layers/lakes");
    const lakeData = await lakeRes.json();

    lakeLayer = L.geoJSON(lakeData, {
        style: {
            color: "blue",
            weight: 1,
            fillOpacity: 0.5
        }
    }).addTo(map);

    // 🟢 Forest
    const forestRes = await fetch("http://127.0.0.1:5000/layers/forest");
    const forestData = await forestRes.json();

    forestLayer = L.geoJSON(forestData, {
        style: {
            color: "green",
            weight: 1,
            fillOpacity: 0.4
        }
    }).addTo(map);
}

// ==========================
// AUTO LOAD LAYERS
// ==========================
loadLayers();