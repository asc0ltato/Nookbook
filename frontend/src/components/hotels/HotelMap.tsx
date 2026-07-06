"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { Hotel } from "@/types/hotel";
import { normalizeHotelImageUrl } from "@/lib/imageUtils";
import { loadYandexMaps } from "@/lib/yandexMaps";
import { useTheme } from "@/contexts/ThemeContext";

interface HotelMapProps {
  hotels: Hotel[];
  cityName: string;
  citySlug?: string;
  cityLatitude?: number;
  cityLongitude?: number;
  highlightedHotelId?: string | null;
  onHotelClick: (hotelId: string) => void;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export const HotelMap = ({ 
  hotels, 
  cityName,
  citySlug,
  cityLatitude,
  cityLongitude,
  highlightedHotelId = null,
  onHotelClick,
}: HotelMapProps) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const markersMapRef = useRef<Map<string, any>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadYandexMaps()
      .then(() => {
        if (!cancelled && window.ymaps && typeof window.ymaps.Map === "function") {
          setMapLoaded(true);
        }
      })
      .catch((err) => console.error(err));

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch {
        }
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
      setMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    if (mapInstanceRef.current) {
      try { mapInstanceRef.current.destroy(); } catch { }
      mapInstanceRef.current = null;
    }

    const centerLat = cityLatitude ?? 53.9045;
    const centerLon = cityLongitude ?? 27.5615;

    window.ymaps.ready(() => {
      if (!mapRef.current || !window.ymaps) return;

      try {
        const map = new window.ymaps.Map(mapRef.current, {
          center: [centerLat, centerLon],
          zoom: 13,
          controls: ["zoomControl", "fullscreenControl"],
        });
        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (error) {
        console.error("Error creating map:", error);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.destroy(); } catch { }
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
      markersMapRef.current.clear();
      setMapReady(false);
    };
  }, [mapLoaded, cityLatitude, cityLongitude]);

  const hotelsIds = useMemo(() => hotels.map((h) => h.id).join(","), [hotels]);
  const markersCacheKey = `${hotelsIds}|${isLight ? "light" : "dark"}`;
  const prevMarkersCacheKeyRef = useRef<string>("");

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.ymaps) return;
    if (markersCacheKey === prevMarkersCacheKeyRef.current) return;

    prevMarkersCacheKeyRef.current = markersCacheKey;
    
    const map = mapInstanceRef.current;
    const centerLat = cityLatitude ?? 53.9045;
    const centerLon = cityLongitude ?? 27.5615;

    window.ymaps.ready(() => {
      try {
        markersRef.current.forEach(marker => {
          map.geoObjects.remove(marker);
        });
        markersRef.current = [];
        markersMapRef.current.clear();

        if (hotels.length === 0) {
          map.setCenter([centerLat, centerLon], 13);
          return;
        }

        const hotelMarkers: any[] = [];
        
        hotels.forEach((hotel) => {
          if (!hotel.latitude || !hotel.longitude) return;

          const stars = Math.max(0, Math.min(5, hotel.stars ?? 0));
          const reviewCount = hotel.reviewCount || 0;
          
          const getReviewText = () => {
            if (reviewCount === 0) return '0 отзывов';
            if (reviewCount === 1) return '1 отзыв';
            if (reviewCount >= 2 && reviewCount <= 4) return `${reviewCount} отзыва`;
            return `${reviewCount} отзывов`;
          };

          const starsHtml = Array.from({ length: 5 })
            .map((_, index) => {
              const filled = index < stars;
              return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" style="display:inline-block; margin-right:1px;">
                <polygon points="10,1 12.59,6.9 19,7.64 14,12.1 15.18,18.5 10,15.27 4.82,18.5 6,12.1 1,7.64 7.41,6.9" 
                  fill="${filled ? "#fbbf24" : "none"}" 
                  stroke="#fbbf24" stroke-width="1" />
              </svg>`;
            })
            .join("");

          const galleryImages = (
            hotel.images?.length
              ? hotel.images
              : hotel.imageUrl
                ? [hotel.imageUrl]
                : []
          )
            .filter((img) => img && !img.includes("block.jpg"))
            .map((img) => normalizeHotelImageUrl(img));
          const carouselId = `hotel-carousel-${hotel.id}`;
          if (typeof window !== "undefined") {
            (window as any).__nookbookCarousel = (window as any).__nookbookCarousel || {};
            (window as any).__nookbookCarousel[carouselId] = { images: galleryImages, index: 0 };
          }
          const dotsHtml = galleryImages
            .map(
              (_, imageIndex) =>
                `<button type="button" aria-label="Фото ${imageIndex + 1}" onclick="window.__nookbookCarouselGoTo&&window.__nookbookCarouselGoTo('${carouselId}',${imageIndex})" data-dot-index="${imageIndex}" style="height:8px;width:${imageIndex === 0 ? "16px" : "8px"};border-radius:9999px;border:none;cursor:pointer;background:${imageIndex === 0 ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)"};padding:0;transition:width 0.2s,background 0.2s;"></button>`,
            )
            .join("");
          const carouselNav =
            galleryImages.length > 1
              ? `<button type="button" aria-label="Предыдущее фото" onclick="window.__nookbookCarouselPrev&&window.__nookbookCarouselPrev('${carouselId}')" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.55);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">‹</button>
                  <button type="button" aria-label="Следующее фото" onclick="window.__nookbookCarouselNext&&window.__nookbookCarouselNext('${carouselId}')" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.55);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">›</button>
                  <div id="${carouselId}-dots" style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:2;align-items:center;">${dotsHtml}</div>`
              : "";
          const firstImage = galleryImages[0] || "";

          const cardBg = isLight
            ? "background: #ffffff; border: 1px solid #e5e7eb;"
            : "background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);";
          const titleColor = isLight ? "#111827" : "#ffffff";
          const mutedColor = isLight ? "#6b7280" : "#9ca3af";
          const priceSubColor = isLight ? "#6b7280" : "#4b5563";
          const ratingBadge =
            reviewCount > 0
              ? `<div style="background: #fbbf24; border-radius: 8px; padding: 4px 8px;">
                  <span style="font-size: 14px; font-weight: 700; color: #1a1a1a;">${hotel.rating?.toFixed(1) || "—"}</span>
                </div>`
              : "";

          const hotelMarker = new window.ymaps.Placemark(
            [hotel.latitude, hotel.longitude],
            {
              balloonContentHeader: ``,
              balloonContentBody: `
                <div style="${cardBg} border-radius: 16px; overflow: hidden; width: 300px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);">
                  ${firstImage ? `
                    <div style="position: relative; width: 100%; height: 160px; overflow: hidden;">
                      <img id="${carouselId}-img" src="${firstImage}" style="width: 100%; height: 100%; object-fit: cover;" />
                      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%);"></div>
                      ${carouselNav}
                    </div>
                  ` : ""}
                  <div style="padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px;">
                      <h3 style="font-size: 18px; font-weight: 700; color: ${titleColor}; margin: 0; line-height: 1.3;">${hotel.name}</h3>
                      ${ratingBadge}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                      <span style="display: flex; align-items: center;">${starsHtml}</span>
                      <span style="color: ${mutedColor}; font-size: 11px;">${getReviewText()}</span>
                    </div>
                    <div style="margin-bottom: 12px;">
                      <div style="font-size: 24px; font-weight: 800; color: #fbbf24;">
                        ${hotel.price.toLocaleString()} BYN
                      </div>
                      <div style="font-size: 11px; color: ${priceSubColor};">за сутки</div>
                    </div>
                    <button 
                      onclick="window.location.href='/hotels/${citySlug || cityName.toLowerCase()}/${hotel.id}'"
                      style="width: 100%; padding: 10px; background: #fbbf24; color: #1a1a1a; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 13px; margin-top: 4px; font-family: inherit;"
                      onmouseover="this.style.background='#f59e0b'"
                      onmouseout="this.style.background='#fbbf24'"
                    >
                      Посмотреть отель
                    </button>
                  </div>
                </div>
              `,
              balloonContentFooter: ``,
              hintContent: `${hotel.name} — от ${hotel.price.toLocaleString()} BYN`,
            },
            {
              preset: "islands#yellowIcon",
              iconColor: "#fbbf24",
            }
          );

          hotelMarker.events.add("mouseenter", function () {
            hotelMarker.options.set("preset", "islands#yellowDotIcon");
          });

          hotelMarker.events.add("mouseleave", function () {
            hotelMarker.options.set("preset", "islands#yellowIcon");
          });

          hotelMarker.events.add("click", function () {
            hotelMarker.balloon.open();
          });

          map.geoObjects.add(hotelMarker);
          hotelMarkers.push(hotelMarker);
          markersMapRef.current.set(String(hotel.id), hotelMarker);
        });

        markersRef.current = hotelMarkers;

        if (hotelMarkers.length > 0) {
          map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, duration: 300 });
        } else {
          map.setCenter([centerLat, centerLon], 13);
        }
      } catch (error) {
        console.error("Error updating markers:", error);
      }
    });
  }, [mapReady, markersCacheKey, hotels, cityName, citySlug, cityLatitude, cityLongitude, isLight]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateCarouselUi = (id: string) => {
      const state = (window as any).__nookbookCarousel?.[id];
      if (!state?.images?.length) return;
      const img = document.getElementById(`${id}-img`) as HTMLImageElement | null;
      if (img) img.src = state.images[state.index];
      const dots = document.getElementById(`${id}-dots`);
      if (dots) {
        Array.from(dots.children).forEach((dot, imageIndex) => {
          const el = dot as HTMLElement;
          const active = imageIndex === state.index;
          el.style.width = active ? "16px" : "8px";
          el.style.background = active ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)";
        });
      }
    };

    (window as any).__nookbookCarouselGoTo = (id: string, index: number) => {
      const state = (window as any).__nookbookCarousel?.[id];
      if (!state?.images?.length) return;
      state.index = index % state.images.length;
      updateCarouselUi(id);
    };
    (window as any).__nookbookCarouselPrev = (id: string) => {
      const state = (window as any).__nookbookCarousel?.[id];
      if (!state?.images?.length) return;
      state.index = (state.index - 1 + state.images.length) % state.images.length;
      updateCarouselUi(id);
    };
    (window as any).__nookbookCarouselNext = (id: string) => {
      const state = (window as any).__nookbookCarousel?.[id];
      if (!state?.images?.length) return;
      state.index = (state.index + 1) % state.images.length;
      updateCarouselUi(id);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.ymaps) return;
    const map = mapInstanceRef.current;

    markersMapRef.current.forEach((marker, hotelId) => {
      const isHighlighted = highlightedHotelId != null && String(hotelId) === String(highlightedHotelId);
      marker.options.set(
        "preset",
        isHighlighted ? "islands#redDotIcon" : "islands#yellowIcon",
      );
      marker.options.set("iconColor", isHighlighted ? "#ef4444" : "#fbbf24");
    });

    if (highlightedHotelId) {
      const marker = markersMapRef.current.get(String(highlightedHotelId));
      if (marker) {
        try {
          marker.balloon.open();
          const coords = marker.geometry.getCoordinates();
          map.panTo(coords, { duration: 300, flying: true });
        } catch {
        }
      }
    }
  }, [highlightedHotelId, mapReady, hotelsIds]);

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      <div className="flex-1 relative overscroll-contain touch-pan-y">
       <div
  ref={mapRef}
  className="w-full h-full"
  style={{ touchAction: "pan-y pinch-zoom" }}
/>
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Загрузка карты...</p>
            </div>
          </div>
        )}
        <div
          className={`absolute bottom-0 left-0 right-0 pt-8 pb-4 px-4 pointer-events-none ${
            isLight
              ? "bg-gradient-to-t from-background via-background/95 to-transparent"
              : "bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/95 to-transparent"
          }`}
        >
          <div
            className={`backdrop-blur-md rounded-xl p-4 border shadow-lg ${
              isLight
                ? "bg-background/95 border-border"
                : "bg-[#1a1a1a]/95 border-[#2a2a2a]"
            }`}
          >
            <p className={`text-sm text-center font-medium ${isLight ? "text-muted-foreground" : "text-[#d1d5db]"}`}>
              {hotels.length === 0 ? '0 отелей' : hotels.length === 1 ? '1 отель' : hotels.length <= 4 ? `${hotels.length} отеля` : `${hotels.length} отелей`} на карте • 
              <span className={`ml-1 ${isLight ? "text-foreground" : "text-white"}`}>Кликните на метку для деталей</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};