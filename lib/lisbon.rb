class Lisbon
  def contains?(feature)
    feature["properties"]["DTMN21"] == "1106"
  end

  def freguesia_name(code)
    {
      "110601" => "Ajuda",
      "110602" => "Alcântara",
      "110654" => "Alvalade",
      "110655" => "Areeiro",
      "110656" => "Arroios",
      "110657" => "Avenidas Novas",
      "110607" => "Beato",
      "110658" => "Belém",
      "110608" => "Benfica",
      "110659" => "Campo de Ourique",
      "110610" => "Campolide",
      "110611" => "Carnide",
      "110660" => "Estrela",
      "110618" => "Lumiar",
      "110621" => "Marvila",
      "110661" => "Misericórdia",
      "110633" => "Olivais",
      "110662" => "Parque das Nações",
      "110663" => "Penha de França",
      "110664" => "Santa Clara",
      "110665" => "Santa Maria Maior",
      "110666" => "Santo António",
      "110639" => "São Domingos de Benfica",
      "110667" => "São Vicente"
    }[code]
  end
end
