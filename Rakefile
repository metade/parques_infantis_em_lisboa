require "json"
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
      children_per_playground = playground_count.zero? ? nil : feature.children_under_14 / playground_count.to_f

      {
        type: "Feature",
        properties: {
          bgri_2021_id: feature.bgri_2021_id,
          children_under_14: feature.children_under_14,
          playground_count: playground_count,
          children_per_playground: children_per_playground,
          adequacy: "none"
        },
        geometry: feature.geometry
      }
    end

  data = {
    type: "FeatureCollection",
    features: features
  }

  File.write("data/bgri_analysis.geojson", JSON.pretty_generate(data))
end
