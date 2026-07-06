"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolvePublicAssetUrl, toRelativeAssetPath } from "@/lib/imageUtils";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  controlsClassName?: string;
  dotsClassName?: string;
  sizes?: string;
  fallback?: string;
  normalize?: (imageUrl?: string | null) => string;
}

function resolveSlideSrc(
  raw: string,
  normalize?: (imageUrl?: string | null) => string
): string {
  const normalized = normalize ? normalize(raw) : raw;
  return resolvePublicAssetUrl(toRelativeAssetPath(normalized));
}

export const ImageCarousel = ({
  images,
  alt,
  className,
  imageClassName,
  controlsClassName,
  dotsClassName,
  fallback = "/assets/hotels/block.jpg",
  normalize,
}: ImageCarouselProps) => {
  const displayImages = (images.length > 0 ? images : [fallback]).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    setIndex((current) => (current >= displayImages.length ? 0 : current));
    setFailedImages(new Set());
  }, [displayImages.length, displayImages.join("|")]);

  const hasMultipleImages = displayImages.length > 1;
  const activeRaw = failedImages.has(index) ? fallback : displayImages[index] || fallback;
  const src = resolveSlideSrc(activeRaw, normalize);

  const showPrevious = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current - 1 + displayImages.length) % displayImages.length);
  };

  const showNext = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current + 1) % displayImages.length);
  };

  return (
    <div className={cn("relative overflow-hidden bg-gray-200", className)}>
      <img
        key={`${index}-${src}`}
        src={src}
        alt={alt}
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full object-cover",
          imageClassName
        )}
        onError={() => setFailedImages((current) => new Set(current).add(index))}
      />
      {hasMultipleImages && (
        <>
          <button
            type="button"
            aria-label="Предыдущее фото"
            className={cn(
              "pointer-events-auto absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75",
              controlsClassName
            )}
            onClick={showPrevious}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Следующее фото"
            className={cn(
              "pointer-events-auto absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75",
              controlsClassName
            )}
            onClick={showNext}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div
            className={cn(
              "pointer-events-auto absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5",
              dotsClassName
            )}
          >
            {displayImages.map((_, imageIndex) => (
              <button
                type="button"
                aria-label={`Показать фото ${imageIndex + 1}`}
                key={imageIndex}
                className={cn(
                  "h-2 w-2 rounded-full bg-white/55 transition hover:bg-white",
                  imageIndex === index && "w-4 bg-white"
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIndex(imageIndex);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
