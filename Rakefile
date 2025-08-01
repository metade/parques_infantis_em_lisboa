require "json"
require "h3"
require_relative "lib/lisbon"
require_relative "lib/playgrounds"
require_relative "lib/my_geojson_feature"

task :build_data do
  lisbon = Lisbon.new
  playgrounds = Playgrounds.new
  data = JSON.parse(File.read("data/src/BGRI2021_1106.geojson"))

  features = data["features"]
    .select { |feature| lisbon.contains?(feature) }
    .map do |raw_feature|
      feature = MyGeoJsonFeature.new(raw_feature)
      playground_count = playgrounds.count_in_area(feature.geometry)
      nearest_playground_distance = playgrounds.closest_distance_from(feature.geometry)
      children_per_playground = playground_count.zero? ?
        nil :
        feature.children_under_14 / playground_count.to_f

      {
        type: "Feature",
        properties: {
          bgri_2021_id: feature.bgri_2021_id,
          children_under_14: feature.children_under_14,
          playground_count: playground_count,
          children_per_playground: children_per_playground,
          nearest_playground_distance: nearest_playground_distance,
          adequacy: "none"
        },
        geometry: feature.geometry
      }
    end

  data = {
    type: "FeatureCollection",
    features: features
  }

  File.write("docs/data/bgri_analysis.geojson", JSON.pretty_generate(data))
end

task :build_h3_data do
  lisbon = Lisbon.new
  playgrounds = Playgrounds.new
  data = JSON.parse(File.read("data/src/BGRI2021_1106.geojson"))

  h3_data = {}
  empty_features = []
  data["features"]
    .select { |feature| lisbon.contains?(feature) }
    .each do |raw_feature|
      feature = MyGeoJsonFeature.new(raw_feature)
      hexes = feature.hexes

      if hexes.empty?
        feature = MyGeoJsonFeature.new(raw_feature)
        playground_count = playgrounds.count_in_area(feature.geometry)
        nearest_playground_distance = playgrounds.closest_distance_from(feature.geometry)
        children_per_playground = playground_count.zero? ?
          nil :
          feature.children_under_14 / playground_count.to_f

        empty_features << {
          type: "Feature",
          properties: {
            bgri_2021_id: feature.bgri_2021_id,
            children_under_14: feature.children_under_14,
            playground_count: playground_count,
            children_per_playground: children_per_playground,
            nearest_playground_distance: nearest_playground_distance,
            adequacy: "none"
          },
          geometry: feature.geometry
        }
        next
      end

      hexes.each do |hex|
        h3_index = hex[:id]
        h3_data[h3_index] ||= {
          bgri_2021_id: {},
          freguesias: Set.new,
          children_under_14: 0,
          playground_count: playgrounds.count_in_area(hex[:geometry]),
          nearest_playground_distance: playgrounds.closest_distance_from(hex[:geometry]),
          coordinates: hex[:coordinates]
        }

        h3_data[h3_index][:bgri_2021_id][feature.bgri_2021_id] = hex[:weight].round(2)
        h3_data[h3_index][:children_under_14] += feature.children_under_14.to_f * hex[:weight]
        h3_data[h3_index][:children_per_playground] = h3_data[h3_index][:playground_count].zero? ?
          nil :
          h3_data[h3_index][:children_under_14] / h3_data[h3_index][:playground_count]
        h3_data[h3_index][:freguesias] << lisbon.freguesia_name(hex[:freguesia_code])
      end
    end

  p h3_data.size
  geojson_data = {
    type: "FeatureCollection",
    features: empty_features + h3_data.map do |h3_index, data|
      {
        type: "Feature",
        properties: {
          bgri_2021_id: data[:bgri_2021_id],
          freguesias: data[:freguesias].sort.to_a,
          children_under_14: data[:children_under_14]&.round(2),
          playground_count: data[:playground_count],
          children_per_playground: data[:children_per_playground]&.round(2),
          nearest_playground_distance: data[:nearest_playground_distance]&.round(2)
        },
        geometry: {
          type: "MultiPolygon",
          coordinates: [data[:coordinates]]
        }
      }
    end
  }

  File.write("docs/data/h3_bgri_analysis.geojson", JSON.pretty_generate(geojson_data))
end
