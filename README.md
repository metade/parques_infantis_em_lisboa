# Lisbon playgrounds

## Data sources:

1. Playgrounds: https://dados.cm-lisboa.pt/dataset/parques-infantis
2. Census data: https://mapas.ine.pt/download/index2021.phtml

Converted into geojson using:
```
ogr2ogr -f GeoJSON -t_srs EPSG:4326 data/src/BGRI2021_1106.geojson data/src/BGRI2021_1106.gpkg -nlt MULTIPOLYGON -makevalid
```
