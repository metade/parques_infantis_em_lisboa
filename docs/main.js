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
  L.geoJSON(censusData, {
    style: function (feature) {
      const ratio = feature.properties.children_per_playground;
      let fill = "gray";

      if (ratio === null) {
        fill = "gray"; // No playgrounds
      } else if (ratio <= 50) {
        fill = "green";
      } else if (ratio <= 100) {
        fill = "yellow";
      } else {
        fill = "red";
      }

      return {
        fillColor: fill,
        weight: 1,
        color: "#444",
        fillOpacity: 0.4,
      };
    },
    onEachFeature: function (feature, layer) {
      const c = feature.properties.children_under_14;
      const p = feature.properties.playground_count;
      const ratio = feature.properties.children_per_playground;

      const popup = `
        <strong>Children 0–14:</strong> ${c}<br>
        <strong>Playgrounds:</strong> ${p}<br>
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
