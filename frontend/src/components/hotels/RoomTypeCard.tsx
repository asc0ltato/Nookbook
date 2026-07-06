"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Users, Check, Coffee, Droplet, Tv, Wind, Lock, Sparkles, Maximize } from "lucide-react";
import { getRoomCarouselImages, normalizeRoomImageUrl } from "@/lib/imageUtils";
import { ImageCarousel } from "@/components/shared/ImageCarousel";

export interface RoomMealOption {
  mealType: number;
  mealLabel: string;
  availableCount: number;
  price: number;
  roomId: number;
}

interface RoomTypeGroup {
  roomTypeId: number;
  roomTypeName: string;
  description: string;
  minPrice: number;
  maxGuests: number;
  bedCount: number;
  size: number;
  imageUrl: string;
  images?: string[];
  availableCount: number;
  amenities: string[];
  mealOptions?: RoomMealOption[];
}

interface RoomTypeCardProps {
  roomType: RoomTypeGroup;
  onBook: (roomTypeId: number, roomId: number, price: number) => void;
  bookingEnabled?: boolean;
  selected?: boolean;
  selectedRoomId?: number | null;
  activeMealFilter?: number | null;
}

const roomAmenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Чайник": Coffee,
  "Холодильник": Droplet,
  "Телевизор": Tv,
  "Кондиционер": Wind,
  "Сейф": Lock,
  "Фен": Sparkles,
};

export const RoomTypeCard = ({
  roomType,
  onBook,
  bookingEnabled = true,
  selected,
  selectedRoomId,
  activeMealFilter = null,
}: RoomTypeCardProps) => {
  const isUnavailable = roomType.availableCount <= 0;
  const roomImages = getRoomCarouselImages(roomType.images, roomType.imageUrl);
  const mealOptions = (roomType.mealOptions || []).filter(
    (m) => activeMealFilter === null || m.mealType === activeMealFilter
  );
  const freeRoomsCount = mealOptions.reduce((sum, m) => sum + Math.max(0, m.availableCount), 0);

  const cleanDescription = (description: string, amenities: string[] = []) => {
    let cleaned = description;
    amenities.forEach((amenity) => {
      cleaned = cleaned
        .replace(new RegExp(`${amenity}[,\\.]?\\s*`, "gi"), "")
        .replace(new RegExp(`,\\s*${amenity}[,\\.]?`, "gi"), "");
    });
    return cleaned.replace(/,\s*,/g, ",").replace(/^\s*,\s*/, "").replace(/\s*,\s*$/, "").trim();
  };

  const cleanedDescription = cleanDescription(roomType.description, roomType.amenities);

  const handleMealSelect = (option: RoomMealOption) => {
    if (!bookingEnabled || option.availableCount <= 0) return;
    onBook(roomType.roomTypeId, option.roomId, option.price);
  };

  const handleCardClick = () => {
    if (!bookingEnabled || isUnavailable) return;
    const firstAvailable = mealOptions.find((m) => m.availableCount > 0) ?? mealOptions[0];
    if (!firstAvailable) return;
    onBook(roomType.roomTypeId, firstAvailable.roomId, firstAvailable.price);
  };

  const roomsLabel = (count: number) => {
    if (count === 1) return "свободный номер";
    if (count >= 2 && count <= 4) return "свободных номера";
    return "свободных номеров";
  };

  return (
    <Card
      className={`border rounded-xl overflow-hidden transition-all bg-card/80 ${
        isUnavailable
          ? "opacity-70 cursor-not-allowed order-last"
          : bookingEnabled
            ? "cursor-pointer hover:border-amber-500/40"
            : ""
      } ${selected ? "border-amber-500 ring-1 ring-amber-500/30" : "border-border"}`}
      onClick={bookingEnabled ? handleCardClick : undefined}
    >
      <div className="flex flex-col lg:flex-row">
        <div className="relative w-full lg:w-64 min-h-[200px] lg:min-h-[220px] flex-shrink-0 bg-muted">
          <ImageCarousel
            images={roomImages}
            alt={roomType.roomTypeName}
            className="absolute inset-0 h-full w-full"
            imageClassName="object-cover"
            sizes="(max-width: 1024px) 100vw, 256px"
            normalize={normalizeRoomImageUrl}
            fallback="/assets/rooms/block.jpg"
          />
          {isUnavailable && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center z-10">
              <span className="text-white text-sm font-medium">Нет мест</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border/50">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-semibold text-xl text-foreground">{roomType.roomTypeName}</h3>
                {freeRoomsCount > 0 && (
                  <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">
                    {freeRoomsCount} {roomsLabel(freeRoomsCount)}
                  </Badge>
                )}
              </div>
              {cleanedDescription && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{cleanedDescription}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  до {roomType.maxGuests} гостей
                </span>
                {roomType.size > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Maximize className="w-4 h-4" />
                    {roomType.size} м²
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  {roomType.bedCount} {roomType.bedCount === 1 ? "кровать" : "кровати"}
                </span>
              </div>
              {roomType.amenities.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/40">
                  {roomType.amenities.map((amenity) => {
                    const Icon = roomAmenityIcons[amenity] || Check;
                    return (
                      <span key={amenity} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon className="w-3.5 h-3.5 text-amber-500/80" />
                        {amenity}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0 sm:pl-4">
              <div className="text-2xl font-bold text-amber-400">
                от {roomType.minPrice.toLocaleString()} BYN
              </div>
              <p className="text-xs text-muted-foreground mt-1">за сутки</p>
            </div>
          </div>

          {mealOptions.length > 0 && (
            <div className="divide-y divide-border/50" onClick={(e) => e.stopPropagation()}>
              {mealOptions.map((option) => {
                const isSelected = selectedRoomId === option.roomId;
                const noneLeft = option.availableCount <= 0;
                return (
                  <button
                    key={`${option.roomId}-${option.mealType}`}
                    type="button"
                    disabled={noneLeft || !bookingEnabled}
                    onClick={() => handleMealSelect(option)}
                    className={`w-full flex items-center justify-between px-5 py-3 text-sm transition-colors ${
                      noneLeft || !bookingEnabled
                        ? "opacity-50 cursor-not-allowed text-muted-foreground"
                        : isSelected
                          ? "bg-amber-500/10 text-amber-300"
                          : "hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <span className="font-medium">{option.mealLabel}</span>
                    <span className="flex items-center gap-3">
                      {option.availableCount === 1 && (
                        <Badge className="bg-rose-600 hover:bg-rose-600 text-white text-xs">
                          Остался 1 номер
                        </Badge>
                      )}
                      <span className="font-semibold text-amber-400">
                        {option.price.toLocaleString()} BYN
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
