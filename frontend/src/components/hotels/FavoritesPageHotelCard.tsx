"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Hotel } from "@/types/hotel";
import { getHotelCarouselImages, normalizeHotelImageUrl } from "@/lib/imageUtils";
import { calculateDistance } from "@/lib/distanceUtils";
import { ImageCarousel } from "@/components/shared/ImageCarousel";
import { usersApi } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type FavoritesPageHotel = Hotel & {
  description?: string;
  address?: string;
};

interface FavoritesPageHotelCardProps {
  hotel: FavoritesPageHotel;
  cityName: string;
  citySlug?: string;
  cityLatitude?: number;
  cityLongitude?: number;
}

export function FavoritesPageHotelCard({
  hotel,
  cityName,
  citySlug,
  cityLatitude,
  cityLongitude,
}: FavoritesPageHotelCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const authUserId =
    user?.id == null ? 0 : typeof user.id === "string" ? parseInt(user.id, 10) : Number(user.id);
  const authUserIdOk = Number.isFinite(authUserId) && authUserId > 0;

  const removeFavoriteMutation = useMutation({
    mutationFn: () => {
      if (!authUserIdOk) throw new Error("Нет пользователя");
      const hid = typeof hotel.id === "string" ? parseInt(hotel.id, 10) : Number(hotel.id);
      return usersApi.removeFavorite(authUserId, hid);
    },
    onMutate: async () => {
      const queryKey = ["favorites", authUserId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<any>(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        const prevList: any[] = Array.isArray(old?.data) ? old.data : [];
        const hid = typeof hotel.id === "string" ? parseInt(hotel.id, 10) : Number(hotel.id);
        return {
          ...(old || {}),
          data: prevList.filter((f: any) => Number(f?.id ?? f?.Id ?? 0) !== hid),
        };
      });

      return { previous, queryKey };
    },
    onSuccess: () => {
      toast.success("Отель удален из избранного");
    },
    onError: (error: any, _variables, context: any) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      const status = error?.status ?? error?.response?.status;
      const msg = String(error?.response?.data?.message ?? error?.message ?? "");
      if (status === 401 || msg.toLowerCase().includes("не авторизован")) {
        toast.error("Войдите в аккаунт, чтобы работать с избранным");
        return;
      }
      if (status === 403) {
        toast.error("Нет доступа к избранному");
        return;
      }
      toast.error("Ошибка при удалении из избранного");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const handleRemoveFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFavoriteMutation.mutate();
  };

  const imageUrls = getHotelCarouselImages(hotel.images, hotel.imageUrl);

  const calculatedDistance =
    cityLatitude != null && cityLongitude != null && hotel.latitude != null && hotel.longitude != null
      ? calculateDistance(cityLatitude, cityLongitude, hotel.latitude, hotel.longitude)
      : 0;

  const slug = citySlug || cityName.toLowerCase();
  const detailHref = `/hotels/${slug}/${hotel.id}`;
  const safeRating = Number.isFinite(hotel.rating) ? hotel.rating : 0;
  const reviewCount = Number.isFinite(hotel.reviewCount) ? hotel.reviewCount : 0;

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "bg-green-500";
    if (rating >= 8) return "bg-blue-500";
    if (rating >= 7) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const openHotel = () => {
    window.open(detailHref, "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 border border-border/50 group hover:scale-[1.01] overflow-hidden bg-gradient-to-br from-card to-card/95 backdrop-blur-sm w-full max-w-[1250px]"
      onClick={openHotel}
    >
      <CardContent className="p-0">
        <div className="flex gap-0 h-[300px] w-full">
          <div className="relative flex-shrink-0 w-[220px] overflow-hidden rounded-l-lg group-hover:scale-105 transition-transform duration-500 bg-gray-200">
            <ImageCarousel
              images={imageUrls}
              alt={hotel.name}
              sizes="300px"
              className="absolute inset-0 h-full w-full"
              imageClassName="group-hover:brightness-110 group-hover:contrast-105 transition-all duration-500 h-full"
              normalize={normalizeHotelImageUrl}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
            <div className="pointer-events-none absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <button
              onClick={handleRemoveFavorite}
              disabled={removeFavoriteMutation.isPending}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/95 backdrop-blur-md hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl z-10 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Heart className="w-5 h-5 fill-red-500 text-red-500 transition-all duration-200" />
            </button>
          </div>
    
          <div className="flex-1 p-6 flex flex-col justify-between bg-gradient-to-br from-card via-card/98 to-card/95">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  <h3 className="text-2xl font-serif font-semibold mb-2.5 group-hover:text-primary transition-colors duration-300">
                    {hotel.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                    ))}
                    {hotel.stars === 0 && <span className="text-sm text-muted-foreground">Без звезд</span>}
                  </div>
                </div>

                {reviewCount > 0 && (
                  <div className="text-right flex-shrink-0">
                    <div
                      className={cn(
                        "inline-flex items-center justify-center gap-1 w-auto px-3 h-10 rounded-full text-white text-sm font-bold mb-1.5 shadow-lg transition-transform group-hover:scale-110 duration-300",
                        getRatingColor(safeRating)
                      )}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {safeRating.toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {(() => {
                        if (reviewCount === 1) return "1 отзыв";
                        if (reviewCount >= 2 && reviewCount <= 4) return `${reviewCount} отзыва`;
                        return `${reviewCount} отзывов`;
                      })()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="w-4 h-4 flex-shrink-0 text-primary/70" />
                <span className="font-heading font-medium">{hotel.city}</span>
                {calculatedDistance > 0 && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-muted-foreground/80">{calculatedDistance.toFixed(1)} км до центра</span>
                  </>
                )}
              </div>

              {hotel.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {hotel.amenities.map((amenity) => (
                    <Badge
                      key={amenity}
                      variant="secondary"
                      className="text-xs px-3 py-1.5 hover:bg-secondary/90 transition-all duration-200 font-medium shadow-sm border border-border/50"
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right border-t border-border/30 pt-4">
              <div className="text-3xl font-heading font-extrabold text-primary mb-1 transition-transform duration-300 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {hotel.price.toLocaleString()} BYN
              </div>
              <p className="text-sm text-muted-foreground font-medium">за 1 сутки</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}