"use client";

import { ImageCarousel } from "@/components/shared/ImageCarousel";
import { normalizeHotelImageUrl } from "@/lib/imageUtils";

interface HotelGalleryProps {
  images: string[];
  hotelName: string;
}

export function HotelGallery({ images, hotelName }: HotelGalleryProps) {
  const displayImages = images?.length ? images : [""];

  return (
    <div className="relative w-full h-96 rounded-2xl overflow-hidden mb-8 bg-gray-200">
      <ImageCarousel
        images={displayImages}
        alt={hotelName}
        className="absolute inset-0 h-full w-full"
        sizes="100vw"
        normalize={normalizeHotelImageUrl}
      />
    </div>
  );
}
