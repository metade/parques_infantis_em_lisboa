class Quiosques
  attr_reader :extra_quiosques

  def initialize(extra_quiosques = [])
    @extra_quiosques = extra_quiosques
  end

  def closest_quiosque_distance(latitude, longitude)
    (extra_quiosques + quiosques).map { |lat, lng|
      Haversine.distance(lat, lng, latitude, longitude).to_meters
    }.min
  end

  private

  def quiosques
    @quiosques ||= begin
      data = JSON.parse(File.read("data/src/quiosques.geojson"))
      data["features"].map do |f|
        [
          f.dig("properties", "LONGITUDE").sub(",", ".").to_f,
          f.dig("properties", "LATITUDE").sub(",", ".").to_f
        ]
      end
    end
  end
end
