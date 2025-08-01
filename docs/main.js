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

var hexLayer;

Promise.all([
  fetch("data/h3_bgri_analysis.geojson").then((r) => r.json()),
  fetch("data/playgrounds.geojson").then((r) => r.json()),
]).then(([censusData, playgroundData]) => {
  const maxChildren = Math.max(
    ...censusData.features.map((f) => f.properties.children_under_14 || 0),
  );
  hexLayer = L.geoJSON(censusData, {
    style: function (feature) {
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

      const popupContent = `
        <strong>Crianças de 0–14 anos:</strong> ${c}<br>
        <strong>Parques Infantis:</strong> ${p}<br>
        <strong>Distancia de Parque Infantil:</strong> ${d}m<br>
      `;
      layer.bindPopup(popupContent);
      layer._originalPopupContent = popupContent; // 💾 Store it for later
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

  setupFreguesiaFilters(hexLayer);
});

function setupFreguesiaFilters(geoJsonLayer) {
  const checkboxContainer = document.getElementById("freguesia-checkboxes");
  const selectAllCheckbox = document.getElementById("select-all-freguesias");
  const features = geoJsonLayer.toGeoJSON().features;

  const freguesiaSet = new Set();
  features.forEach((f) => {
    const freguesias = f.properties.freguesias || [];
    freguesias.forEach((name) => freguesiaSet.add(name));
  });

  geoJsonLayer.eachLayer((layer) => {
    const op = layer.options.fillOpacity;
    layer.options.originalFillOpacity = op;
  });

  const freguesiaList = Array.from(freguesiaSet).sort();
  const visibleFreguesias = new Set(freguesiaList);

  // Generate checkboxes
  freguesiaList.forEach((name) => {
    const id = `freguesia-${name.replace(/\s+/g, "-")}`;
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" id="${id}" value="${name}" checked />
      ${name}
    `;
    checkboxContainer.appendChild(label);
    checkboxContainer.appendChild(document.createElement("br"));
  });

  // Reusable function to update layer visibility
  function updateLayerVisibility() {
    geoJsonLayer.eachLayer((layer) => {
      const props = layer.feature.properties;
      const freguesias = props.freguesias || [];
      const show = freguesias.some((name) => visibleFreguesias.has(name));
      const original = layer.options.originalFillOpacity || 0.4;
      layer.setStyle({
        opacity: show ? 1 : 0,
        fillOpacity: show ? original : 0,
      });
      // Disable popup when hidden
      if (!show) {
        layer.unbindPopup();
      } else {
        // Rebind if missing
        if (!layer.getPopup() && layer._originalPopupContent) {
          layer.bindPopup(layer._originalPopupContent);
        }
      }
    });
  }

  // Listen for individual checkbox changes
  checkboxContainer.addEventListener("change", () => {
    visibleFreguesias.clear();
    const allCheckboxes = checkboxContainer.querySelectorAll(
      'input[type="checkbox"]',
    );
    allCheckboxes.forEach((cb) => {
      if (cb.checked) visibleFreguesias.add(cb.value);
    });

    // Sync "Select All" state
    const allChecked = Array.from(allCheckboxes).every((cb) => cb.checked);
    selectAllCheckbox.checked = allChecked;

    updateLayerVisibility();
  });

  // Handle "Select All" checkbox
  selectAllCheckbox.addEventListener("change", () => {
    const checked = selectAllCheckbox.checked;
    visibleFreguesias.clear();

    const allCheckboxes = checkboxContainer.querySelectorAll(
      'input[type="checkbox"]',
    );
    allCheckboxes.forEach((cb) => {
      cb.checked = checked;
      if (checked) visibleFreguesias.add(cb.value);
    });

    updateLayerVisibility();
  });

  // Initial visibility set
  updateLayerVisibility();
}
