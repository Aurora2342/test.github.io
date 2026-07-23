const defaultEntries = [
  {
    id: "signal-1",
    title: "45thbrigade signal",
    category: "signal",
    lat: 44.8176,
    lng: 20.4633,
    summary: "A notable public signal captured for 45thbrigade monitoring.",
    source: "Telegram",
    date: "2026-07-23"
  },
  {
    id: "incident-1",
    title: "45thbrigade incident report",
    category: "incident",
    lat: 52.52,
    lng: 13.405,
    summary: "A community report tied to an event in the monitored region.",
    source: "OSINT feed",
    date: "2026-07-22"
  },
  {
    id: "channel-1",
    title: "45thbrigade monitoring node",
    category: "channel",
    lat: 40.4168,
    lng: -3.7038,
    summary: "Primary monitoring node associated with the 45thbrigade workflow.",
    source: "Telegram",
    date: "2026-07-21"
  },
  {
    id: "profile-1",
    title: "45thbrigade profile observation",
    category: "profile",
    lat: 34.0522,
    lng: -118.2437,
    summary: "Profile observation that needs follow-up context for 45thbrigade.",
    source: "Profile lookup",
    date: "2026-07-20"
  }
];

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

function loadEntries() {
  fetch("data/entries.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Unable to load data file");
      }
      return response.json();
    })
    .then((data) => {
      entries = Array.isArray(data) && data.length > 0 ? data : defaultEntries;
      render();
    })
    .catch(() => {
      entries = defaultEntries;
      render();
    });
}

function render() {
  const categoryFilter = document.getElementById("categoryFilter").value;
  filteredEntries = entries.filter((entry) => {
    if (categoryFilter === "all") {
      return true;
    }
    return entry.category === categoryFilter;
  });

  renderMarkers();
  renderList();
  updateStats();
}

function renderMarkers() {
  markersLayer.clearLayers();

  filteredEntries.forEach((entry) => {
    const icon = L.divIcon({
      html: `<span style="background:${categoryColors[entry.category] || "#55c0ff"};"></span>`,
      className: "marker-pin",
      iconSize: [22, 22]
    });

    const marker = L.marker([entry.lat, entry.lng], { icon }).addTo(markersLayer);
    marker.bindPopup(buildPopup(entry));
  });

  if (filteredEntries.length > 0) {
    const bounds = L.latLngBounds(filteredEntries.map((entry) => [entry.lat, entry.lng]));
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
      <p><strong>Source:</strong> ${entry.source}</p>
      <button type="button" data-id="${entry.id}">Focus</button>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = filteredEntries.find((item) => item.id === button.getAttribute("data-id"));
      if (entry) {
        map.flyTo([entry.lat, entry.lng], 8, { duration: 1.2 });
      }
    });
  });
}

function buildPopup(entry) {
  return `
    <strong>${entry.title}</strong><br />
    ${entry.summary}<br />
    <em>${entry.date}</em>
  `;
}

function updateStats() {
  document.getElementById("stats").textContent = `${filteredEntries.length} visible entries across ${entries.length} total records.`;
}

window.addEventListener("DOMContentLoaded", () => {
  initMap();
  document.getElementById("categoryFilter").addEventListener("change", render);
  loadEntries();
});
