"use client";

import { Badge } from "@/components/ui/badge";
import { Bed, Users, Maximize, Check, Coffee, Droplet, Tv, Wind, Lock, Sparkles, Utensils } from "lucide-react";
import type { Room } from "@/types/api";
import { ImageCarousel } from "@/components/shared/ImageCarousel";
import { getRoomCarouselImages, normalizeRoomImageUrl } from "@/lib/imageUtils";

interface RoomCardProps {
  room: Room;
  roomTypes: any[];
  compact?: boolean;
}

const roomAmenityIcons: { [key: string]: any } = {
  "Чайник": Coffee,
  "Холодильник": Droplet,
  "Телевизор": Tv,
  "Кондиционер": Wind,
  "Сейф": Lock,
  "Фен": Sparkles,
};

export function RoomCard({ room, roomTypes, compact = false }: RoomCardProps) {
  const roomType = roomTypes.find((rt: any) => rt.name === room.roomType);
  const images = room.images?.length ? room.images : [room.imageUrl || room.image || "/assets/rooms/block.jpg"];
  const hasMeal = room.mealLabel && room.mealLabel.length > 0;

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">{room.name || room.roomNumber || `Номер ${room.id}`}</h4>
          <Badge variant="outline" className="text-xs">{roomType?.name || room.roomType || "Без типа"}</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bed className="w-3 h-3" />
          <span>{room.bedCount} кр.</span>
          <Users className="w-3 h-3" />
          <span>до {room.maxGuests || room.capacity}</span>
          {room.size && <><Maximize className="w-3 h-3" /><span>{room.size} м²</span></>}
        </div>
        {hasMeal && (
          <div className="flex items-center gap-1 text-xs text-primary/80">
            <Utensils className="w-3 h-3" />
            <span>{room.mealLabel}</span>
          </div>
        )}
        <div className="font-semibold text-primary text-sm">
          {(room.price || room.pricePerNight || 0).toLocaleString()} BYN/сутки
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative w-full md:w-40 h-32 md:h-auto rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
        <ImageCarousel
          images={images}
          alt={room.name || room.roomNumber || `Номер ${room.id}`}
          className="absolute inset-0 h-full w-full"
          imageClassName="object-cover"
          sizes="160px"
          normalize={normalizeRoomImageUrl}
          fallback="/assets/rooms/block.jpg"
        />
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold">{room.name || room.roomNumber || `Номер ${room.id}`}</h4>
          <Badge variant="outline">{roomType?.name || room.roomType || "Без типа"}</Badge>
        </div>

        {room.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{room.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4" />
            <span>{room.bedCount} {room.bedCount === 1 ? 'кровать' : room.bedCount && room.bedCount <= 4 ? 'кровати' : 'кроватей'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>до {room.maxGuests || room.capacity} {(room.maxGuests === 1 || room.capacity === 1) ? 'гостя' : 'гостей'}</span>
          </div>
          {room.size && (
            <div className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              <span>{room.size} м²</span>
            </div>
          )}
        </div>

        {hasMeal && (
          <div className="flex items-center gap-1.5 text-sm text-primary/80 font-medium">
            <Utensils className="w-4 h-4" />
            <span>{room.mealLabel}</span>
          </div>
        )}

        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {room.amenities.slice(0, 4).map((amenity) => {
              const Icon = roomAmenityIcons[amenity] || Check;
              return (
                <div key={amenity} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  <Icon className="w-3 h-3 text-primary" />
                  <span>{amenity}</span>
                </div>
              );
            })}
            {room.amenities.length > 4 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">+{room.amenities.length - 4}</span>
            )}
          </div>
        )}

        <div className="font-bold text-primary">
          {(room.price || room.pricePerNight || 0).toLocaleString()} BYN/сутки
        </div>
      </div>
    </div>
  );
}

