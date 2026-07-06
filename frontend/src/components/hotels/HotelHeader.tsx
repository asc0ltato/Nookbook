"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Heart, Share2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface HotelHeaderProps {
  hotelName: string;
  description?: string;
  stars?: number;
  address?: string;
  citySlug: string;
  cityName: string;
  isFavorite: boolean;
  isAuthenticated: boolean;
  rating: number;
  reviewCount: number;
  onFavoriteToggle: () => void;
  isFavoriteLoading?: boolean;
}

export function HotelHeader({
  hotelName,
  description,
  stars,
  address,
  citySlug,
  cityName,
  isFavorite,
  isAuthenticated,
  rating,
  reviewCount,
  onFavoriteToggle,
  isFavoriteLoading,
}: HotelHeaderProps) {
  return (
    <div className="mb-6">
      <nav className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
        <Link href="/hotels" className="hover:text-primary transition-colors">Города</Link>
        <span>→</span>
        <Link href={`/hotels/${citySlug}`} className="hover:text-primary transition-colors">{cityName}</Link>
        <span>→</span>
        <span className="text-foreground">{hotelName}</span>
      </nav>

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">{hotelName}</h1>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(stars || 0)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500 hover:bg-green-600 text-white">
                  {rating.toFixed(1)}
                </Badge>
                <span className="text-muted-foreground">
                  ({reviewCount} {reviewCount === 1 ? 'отзыв' : reviewCount < 5 ? 'отзыва' : 'отзывов'})
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5" />
            <span>{address || cityName}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {isAuthenticated && (
            <Button
              variant="outline"
              size="icon"
              onClick={onFavoriteToggle}
              disabled={isFavoriteLoading}
              className={isFavorite ? 'text-red-500' : ''}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: hotelName,
                  text: description,
                  url: window.location.href,
                }).catch((err) => console.error('Error sharing:', err));
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Ссылка скопирована');
              }
            }}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
