const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

const map = L.map("map").setView([38.7169, -9.1399], 12);
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

map.createPane("topLayer");
map.getPane("topLayer").style.zIndex = 650; // higher than overlayPane (400)

Promise.all([
  fetch("data/bgri_analysis.geojson").then((r) => r.json()),
  fetch("data/playgrounds.geojson").then((r) => r.json()),
]).then(([censusData, playgroundData]) => {
  const maxChildren = Math.max(
    ...censusData.features.map((f) => f.properties.children_under_14 || 0),
  );
  L.geoJSON(censusData, {
    style: function (feature) {
      console.log(feature.properties);
      const dist = feature.properties.nearest_playground_distance;
      const kids = feature.properties.children_under_14 || 0;

      // Colour by distance
      let fill;
      if (dist == null) {
        fill = "black"; // debug
      } else if (dist <= 500) {
        fill = "#2e7d32"; // green
      } else if (dist <= 800) {
        fill = "#fdd835"; // yellow
      } else if (dist <= 1000) {
        fill = "#e53935"; // red
      } else {
        fill = "#6a1b9a"; // purple
      }
      // Opacity based on children
      const opacity = Math.min(kids / maxChildren, 1) * 0.9 + 0.1; // minimum opacity 0.1

      return {
        color: "#444",
        weight: 1,
        fillColor: fill,
        fillOpacity: opacity,
      };
    },
    onEachFeature: function (feature, layer) {
      const c = feature.properties.children_under_14;
      const p = feature.properties.playground_count;
      const d = feature.properties.nearest_playground_distance;
      const ratio = feature.properties.children_per_playground;

      const popup = `
        <strong>Children 0–14:</strong> ${c}<br>
        <strong>Playgrounds:</strong> ${p}<br>
        <strong>Distance from Closest Playground:</strong> ${d}<br>
        <strong>Children per Playground:</strong> ${ratio === null ? "∞" : ratio.toFixed(1)}
      `;
      layer.bindPopup(popup);
    },
  }).addTo(map);

  L.geoJSON(playgroundData, {
    pane: "topLayer",
    pointToLayer: function (feature, latlng) {
      const gestor = feature.properties.GESTAO;
      let color;

      switch (gestor) {
        case "CML":
          color = "blue";
          break;
        case "JF":
          color = "green";
          break;
        case "SRU":
          color = "red";
          break;
        default:
          color = "gray";
      }

      return L.circleMarker(latlng, {
        radius: 8,
        fillColor: color,
        color: "#333",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      });
    },

    onEachFeature: function (feature, layer) {
      const props = feature.properties;

      const title = props.DESIGNACAO || "Parque Infantil";
      const address = props.MORADA || "Morada desconhecida";
      const gestor = props.GESTAO || "Não especificado";
      const servico = props.SERVICO_CML || "N/A";

      const popupContent = `
        <strong>${title}</strong><br>
        <em>${address}</em><br>
        <small><strong>Gestão:</strong> ${gestor}</small><br>
        <small><strong>Serviço CML:</strong> ${servico}</small>
      `;

      layer.bindPopup(popupContent);
    },
  }).addTo(map);
});
