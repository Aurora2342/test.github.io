const categoryColors = {
  signal: "#55c0ff",
  incident: "#f6b73c",
  channel: "#7c8eff",
  profile: "#62d07b"
};

let entries = [];
let filteredEntries = [];
let map;
let markersLayer;

function initMap() {
  map = L.map("map", { zoomControl: true }).setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

async function resolveCoordinates(entry) {
  if (entry.lat != null && entry.lng != null) {
    return entry;
  }

  if (!entry.city) {
    return entry;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(entry.city)}`
    );

    if (!response.ok) {
      return entry;
    }

    const [location] = await response.json();
    if (location) {
      entry.lat = parseFloat(location.lat);
      entry.lng = parseFloat(location.lon);
    }
  } catch (error) {
    console.warn("Unable to geocode city", entry.city, error);
  }

  return entry;
}

async function loadEntries() {
  try {
    const response = await fetch(`data/entries.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load data file");
    }

    const data = await response.json();
    const dataEntries = Array.isArray(data) && data.length > 0 ? data : [];
    entries = await Promise.all(dataEntries.map(resolveCoordinates));
    render();
  } catch (error) {
    entries = [];
    render();
  }
}

function render() {
  filteredEntries = entries;

  renderMarkers();
  renderList();
  updateStats();
}

function renderMarkers() {
  markersLayer.clearLayers();

  const mappableEntries = filteredEntries.filter((entry) => Number.isFinite(entry.lat) && Number.isFinite(entry.lng));

  mappableEntries.forEach((entry) => {
    const icon = L.divIcon({
      html: `<span style="background:${categoryColors[entry.category] || "#55c0ff"};"></span>`,
      className: "marker-pin",
      iconSize: [22, 22]
    });

    const marker = L.marker([entry.lat, entry.lng], { icon }).addTo(markersLayer);
    marker.bindPopup(buildPopup(entry));
  });

  if (mappableEntries.length > 0) {
    const bounds = L.latLngBounds(mappableEntries.map((entry) => [entry.lat, entry.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

function renderList() {
  const list = document.getElementById("entryList");
  list.innerHTML = "";

  if (filteredEntries.length === 0) {
    list.innerHTML = '<p class="empty">No entries match this filter.</p>';
    return;
  }

  filteredEntries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "entry-card";
    card.innerHTML = `
      <h3>${entry.title}</h3>
      <p>${entry.summary}</p>
      <p><strong>Category:</strong> ${entry.category}</p>
      <p><strong>Location:</strong> ${entry.city || "Unknown"}</p>
      <p><strong>Source:</strong> ${entry.source}</p>
      <button type="button" data-id="${entry.id}">Focus</button>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = filteredEntries.find((item) => item.id === button.getAttribute("data-id"));
      if (entry && Number.isFinite(entry.lat) && Number.isFinite(entry.lng)) {
        map.flyTo([entry.lat, entry.lng], 8, { duration: 1.2 });
      }
    });
  });
}

function buildPopup(entry) {
  return `
    <strong>${entry.title}</strong><br />
    ${entry.summary}<br />
    <strong>City:</strong> ${entry.city || "Unknown"}<br />
    <em>${entry.date}</em>
  `;
}

function updateStats() {
  document.getElementById("stats").textContent = `${filteredEntries.length} visible entries across ${entries.length} total records.`;
}

window.addEventListener("DOMContentLoaded", () => {
  initMap();
  loadEntries();
});
