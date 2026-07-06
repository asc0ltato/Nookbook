"use client";

import { Card } from "@/components/ui/card";
import { Wifi, Car, UtensilsCrossed, Coffee, Droplet, Tv, Wind, Lock, Sparkles } from "lucide-react";
import { calculateDistance } from "@/lib/distanceUtils";

const amenityIcons: Record<string, React.ReactNode> = {
  "Wi-Fi": <Wifi className="w-4 h-4" />,
  "Парковка": <Car className="w-4 h-4" />,
  "Ресторан": <UtensilsCrossed className="w-4 h-4" />,
  "Бар": <Coffee className="w-4 h-4" />,
  "Бассейн": <Droplet className="w-4 h-4" />,
  "Фитнес-центр": <Wind className="w-4 h-4" />,
  "Спа": <Sparkles className="w-4 h-4" />,
  "Трансфер": <Car className="w-4 h-4" />,
  "Прачечная": <Wind className="w-4 h-4" />,
  "Телевизор": <Tv className="w-4 h-4" />,
  "Сейф": <Lock className="w-4 h-4" />,
};

interface HotelInfoProps {
  description?: string;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  cityCenterLat?: number;
  cityCenterLng?: number;
}

export function HotelInfo({
  description,
  amenities,
  latitude,
  longitude,
  cityCenterLat,
  cityCenterLng,
}: HotelInfoProps) {
  const distance =
    latitude && longitude && cityCenterLat && cityCenterLng
      ? calculateDistance(latitude, longitude, cityCenterLat, cityCenterLng)
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <Card className="p-6 lg:col-span-2">
        <h2 className="text-2xl font-bold mb-4">Описание</h2>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
          {description || "Описание отеля отсутствует"}
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Удобства</h2>
        {amenities.length > 0 ? (
          <div className="space-y-3">
            {amenities.map((amenity) => (
              <div key={amenity} className="flex items-center gap-3">
                {amenityIcons[amenity] || <Sparkles className="w-4 h-4" />}
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Информация об удобствах отсутствует</p>
        )}

        {distance !== null && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Расстояние до центра: <strong>{distance.toFixed(1)} км</strong>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
