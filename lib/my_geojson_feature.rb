require "h3"
require "active_support/core_ext/enumerable"

class MyGeoJsonFeature
  H3_RESOLUTION = 9
  attr_reader :factory

  def initialize(data, factory: nil)
    @data = data
    @factory ||= RGeo::Geographic.spherical_factory(srid: 4326)
  end

  def bgri_2021_id
    @data.dig("properties", "BGRI2021")
  end

  def children_under_14
    @data.dig("properties", "N_INDIVIDUOS_0_14").to_i
  end

  def geometry
    @data["geometry"]
  end

  def coordinates
    raise unless geometry["type"] == "MultiPolygon"
    raise @data.inspect if geometry["coordinates"].many?

    geometry["coordinates"].first
  end

  def hexes(resolution: H3_RESOLUTION)
    geojson_geometry = RGeo::GeoJSON.decode(geometry.to_json, json_parser: :json)
    return [] if geojson_geometry.nil? || geojson_geometry.area.zero?

    total_area = geojson_geometry.area

    # First try polyfill
    h3_indices = H3.polyfill(coordinates, resolution).to_set

    # Fallback: sample along boundary if polyfill is empty or sparse
    if h3_indices.empty?
      geometries = geojson_geometry.polygonize
      geometries.each do |poly|
        poly.exterior_ring.points.each_cons(2) do |a, b|
          segment_length = a.distance(b)
          n = [(segment_length / 10).ceil, 1].max

          (0..n).each do |i|
            frac = i.to_f / n
            lat = a.coordinates.first + frac * (b.coordinates.first - a.coordinates.first)
            lng = a.coordinates.last + frac * (b.coordinates.last - a.coordinates.last)
            h3_indices << H3.from_geo_coordinates([lat, lng], resolution)
          end
        end
      end
    end

    h3_indices.map do |h3_index|
      hex_coords = H3.to_boundary(h3_index)
      hex_ring = factory.polygon(
        factory.linear_ring(
          hex_coords.map { |lat, lng| factory.point(lat, lng) } +
          [factory.point(hex_coords.first[0], hex_coords.first[1])] # close ring
        )
      )

      if geojson_geometry.intersects?(hex_ring)
        intersection = geojson_geometry.intersection(hex_ring)
        next if intersection.nil? || intersection.empty?
        weight = intersection.area / total_area

        {
          id: h3_index,
          geometry: hex_ring,
          coordinates: hex_ring.coordinates,
          weight: weight
        }
      end
    end.compact
  end
end
