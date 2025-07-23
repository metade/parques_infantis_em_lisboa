require "rgeo"
require "rgeo/geo_json"

class Playgrounds
  def initialize
    @factory = RGeo::Geos.factory(
      srid: 4326, uses_lenient_assertions: true
    )
  end

  def count_in_area(geometry)
    polygon_geom = RGeo::GeoJSON.decode(geometry.to_json, json_parser: :json, geo_factory: @factory)
    playgrounds.count { |pt| polygon_geom.contains?(pt) }
  end

  private

  def playgrounds
    @playgrounds ||= begin
      playgrounds = JSON.parse(File.read("data/playgrounds.geojson"))
      playground_points = playgrounds["features"].map do |f|
        RGeo::GeoJSON.decode(f["geometry"].to_json, json_parser: :json, geo_factory: @factory)
      end
    end
  end
end
