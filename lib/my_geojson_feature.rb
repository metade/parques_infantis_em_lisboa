class MyGeoJsonFeature
  def initialize(data)
    @data = data
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
end
