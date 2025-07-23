require "json"
require_relative "lib/playgrounds"

task :build_data do
  playgrounds = Playgrounds.new
  data = JSON.parse(File.read("data/src/BGRI2021_1106.geojson"))

  features = data["features"]
    .select { |feature| feature["properties"]["DTMN21"] == "1106" }
    .map do |feature|
      children_under_14 = feature.dig("properties", "N_INDIVIDUOS_0_14").to_i
      playground_count = playgrounds.count_in_area(feature["geometry"])
      children_per_playground = playground_count.zero? ? nil : children_under_14 / playground_count.to_f

      {
        type: "Feature",
        properties: {
          bgri_2021_id: feature.dig("properties", "BGRI2021"),
          children_under_14: children_under_14,
          playground_count: playground_count,
          children_per_playground: children_per_playground,
          adequacy: "none"
        },
        geometry: feature["geometry"]
      }
    end

  data = {
    type: "FeatureCollection",
    features: features
  }

  File.write("data/bgri_analysis.geojson", JSON.pretty_generate(data))
end
