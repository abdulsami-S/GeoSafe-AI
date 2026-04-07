let map = L.map('map').setView([13.0827, 80.2707], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © OpenStreetMap'
}).addTo(map);

let marker;

async function checkLand() {
    const lat = parseFloat(document.getElementById("lat").value);
    const lon = parseFloat(document.getElementById("lon").value);

    if (!lat || !lon) {
        alert("Please enter valid latitude and longitude");
        return;
    }

    try {
        const res = await fetch("http://127.0.0.1:5000/check", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({lat, lon})
        });

        const data = await res.json();

        // Show full report
        document.getElementById("result").innerText =
            `Risk: ${data.risk}
Legal: ${data.legal_flags.join(", ") || "None"}
Environmental: ${data.environmental_flags.join(", ") || "None"}
Explanation: ${data.explanation}`;

        // Map marker
        if (marker) {
            map.removeLayer(marker);
        }

        marker = L.marker([lat, lon]).addTo(map);
        map.setView([lat, lon], 15);

    } catch (err) {
        alert("Error connecting to backend");
        console.error(err);
    }
}