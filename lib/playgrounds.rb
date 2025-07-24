require "rgeo"
require "rgeo/geo_json"
require "haversine"

class Playgrounds
  def initialize
    @factory = RGeo::Geos.factory(
      srid: 4326, uses_lenient_assertions: true
    )
  end

  def count_in_area(geometry)
    polygon_geom = decode_geometry(geometry)
    playgrounds.count { |pt| polygon_geom.contains?(pt) }
  end

  def closest_distance_from(geometry)
    polygon_geom = decode_geometry(geometry)
    centroid = polygon_geom.centroid
    playgrounds.map { |p| distance(p, centroid) }.min
  end

  private

  def distance(p1, p2)
    Haversine.distance(p1.x, p1.y, p2.x, p2.y).to_meters
  end

  def decode_geometry(geometry)
    RGeo::GeoJSON.decode(geometry.to_json, json_parser: :json, geo_factory: @factory)
  end

  def playgrounds
    @playgrounds ||= begin
      playgrounds = JSON.parse(File.read("data/src/parques_infantis.geojson"))
      playground_points = playgrounds["features"].map do |f|
        RGeo::GeoJSON.decode(f["geometry"].to_json, json_parser: :json, geo_factory: @factory)
      end
    end
  end
end
