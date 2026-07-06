"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { SearchBar } from "@/components/home/SearchBar";
import { SearchHistory } from "@/components/home/SearchHistory";
import { BookingAdvantages } from "@/components/home/BookingAdvantages";
import { CityCard } from "@/components/home/CityCard";
import { hotelsApi, recommendationsApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { ImageCarousel } from "@/components/shared/ImageCarousel";
import { getHotelCarouselImages, normalizeCityImageUrl, normalizeHotelImageUrl } from "@/lib/imageUtils";

const cities = [
  { name: "Минск", slug: "minsk", id: 1, image: "/assets/cities/minsk.jpg" },
  { name: "Брест", slug: "brest", id: 2, image: "/assets/cities/brest.jpg" },
  { name: "Витебск", slug: "vitebsk", id: 3, image: "/assets/cities/vitebsk.jpg" },
  { name: "Гомель", slug: "gomel", id: 4, image: "/assets/cities/gomel.jpg" },
  { name: "Гродно", slug: "grodno", id: 5, image: "/assets/cities/grodno.jfif" },
  { name: "Могилев", slug: "mogilev", id: 6, image: "/assets/cities/mogilev.jpg" },
];

const cityMetaById = new Map(cities.map((city) => [city.id, city]));

const getCitySlug = (city: any) => city.slug || cityMetaById.get(city.id)?.slug || city.name?.toLowerCase() || "";

const getCityImagePath = (city: any) =>
  city.image || city.imageUrl || cityMetaById.get(city.id)?.image || "";

const getResponseItems = (response: any): any[] => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const getHotelCityName = (hotel: any) => {
  if (typeof hotel.city === "string") return hotel.city;
  return hotel.city?.name || cityMetaById.get(hotel.cityId)?.name || "";
};

const getHotelCitySlug = (hotel: any) => {
  const cityId = typeof hotel.cityId === "number" ? hotel.cityId : hotel.city?.id;
  return cityMetaById.get(cityId)?.slug || getHotelCityName(hotel).toLowerCase();
};

const HotelFeatureCard = ({ hotel }: { hotel: any }) => {
  const images = getHotelCarouselImages(hotel.images, hotel.image || hotel.imageUrl);
  const price = Number(hotel.price || hotel.pricePerNight || 0);
  const reviewCount = hotel.reviewCount || hotel.reviews?.length || 0;
  const rating = hotel.rating || 0;

  return (
    <Link
      href={`/hotels/${getHotelCitySlug(hotel)}/${hotel.id}`}
      className="group relative block h-[280px] rounded-2xl overflow-hidden cursor-pointer bg-black border border-gray-800 hover:border-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-500"
    >
      {(hotel.reviewCount ?? 0) > 0 && rating > 0 && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md rounded-full px-3 py-1.5 border border-yellow-500/40">
          <span className="text-yellow-400 font-bold text-sm">{rating.toFixed(1)}</span>
          <span className="text-white/60 text-xs">/ 10</span>
        </div>
      )}
      <ImageCarousel
        images={images}
        alt={hotel.name}
        className="absolute inset-0 h-full w-full"
        controlsClassName="top-[55%]"
        sizes="(max-width: 768px) 100vw, 33vw"
        normalize={normalizeHotelImageUrl}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/0 via-yellow-600/0 to-yellow-400/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

      <div className="relative h-full p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-yellow-500/30">
              <span className="text-yellow-400 text-sm font-bold">{hotel.stars || 0}</span>
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-white/60 text-xs mx-1">•</span>
              <span className="text-white/80 text-xs">{getHotelCityName(hotel)}</span>
            </div>

          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 line-clamp-2 drop-shadow-lg group-hover:translate-x-1 transition-transform duration-300">
            {hotel.name}
          </h3>

          <p className="text-sm text-gray-300/90 line-clamp-2 max-w-[90%] drop-shadow-md">
            {hotel.description || 'Комфортное проживание в центре города'}
          </p>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-gray-400 font-medium">от</span>
              <span className="text-2xl font-extrabold text-yellow-400 tracking-tight">
                {price > 0 ? price.toLocaleString() : "—"}
              </span>
              {price > 0 && (
                <span className="text-xs text-gray-400 font-medium">BYN</span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 -mt-0.5">за ночь</div>
          </div>

          <div className="w-10 h-10 rounded-full bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 flex items-center justify-center group-hover:bg-yellow-500/20 group-hover:border-yellow-500/50 group-hover:scale-110 transition-all duration-300">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function HotelsPage() {
  return <HotelsPageContent />;
}

function HotelsPageContent() {
  const [hasSearchHistory, setHasSearchHistory] = useState(false);
  const [cityPrices, setCityPrices] = useState<{ [key: number]: number }>({});

  const { data: popularDestinations } = useQuery({
    queryKey: ['popular-destinations'],
    queryFn: () => recommendationsApi.getPopularDestinations(3),
    retry: false,
  });

  const { data: popularHotels } = useQuery({
    queryKey: ['popular-hotels'],
    queryFn: () => recommendationsApi.getPopularHotels(3),
    retry: false,
  });

  const recommendedDestinations = getResponseItems(popularDestinations);
  const popularHotelItems = getResponseItems(popularHotels);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const validHistory = history.filter((item: any) => 
        item && 
        typeof item.id === 'string' && 
        typeof item.city === 'string' && 
        typeof item.timestamp === 'number'
      );
      setHasSearchHistory(validHistory.length > 0);
    } catch (error) {
      setHasSearchHistory(false);
    }
  }, []);

  useEffect(() => {
    const fetchCityPrices = async () => {
      const prices: { [key: number]: number } = {};
      for (const city of cities) {
        try {
          const response = await hotelsApi.getByCity(city.id);
          if (response.success && Array.isArray(response.data)) {
            const hotels = response.data as any[];
            const hotelPrices = hotels
              .map((h) => Number(h.price ?? h.Price ?? h.pricePerNight ?? 0))
              .filter((price) => Number.isFinite(price) && price > 0);
            if (hotelPrices.length > 0) {
              const minPrice = Math.min(...hotelPrices);
              if (minPrice !== Infinity) {
                prices[city.id] = minPrice;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching price for ${city.name}:`, error);
        }
      }
      setCityPrices(prices);
    };

    fetchCityPrices();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 scroll-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-black mb-6 leading-none tracking-tight animate-fade-in-up">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-300 to-pink-400 bg-clip-text text-transparent">
                Найдём, где остановиться!
              </span>
            </h1>
            <p className="font-sans text-xl sm:text-2xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto font-medium leading-relaxed animate-fade-in-up animation-delay-300">
              Откройте для себя лучшие отели Беларуси. 
              Комфорт, качество и незабываемые впечатления ждут вас
            </p>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden mb-8 shadow-2xl animate-fade-in-up animation-delay-600">
            <div className="absolute inset-0">
              <Image 
                src={normalizeCityImageUrl("/assets/cities/block.jpg")}
                alt="Background" 
                fill
                unoptimized
                sizes="100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/50" />
            </div>
            <div className="relative z-10 py-10 px-6 sm:px-8 lg:px-10">
              <SearchBar />
            </div>
          </div>
          
          <div className="mb-8 animate-fade-in-up animation-delay-900">
            <SearchHistory />
          </div>
          
          {!hasSearchHistory && (
            <div className="mb-10">
              <BookingAdvantages compact={true} />
            </div>
          )}
          
          {hasSearchHistory && (
            <div className="mb-10">
              <BookingAdvantages compact={false} />
            </div>
          )}

          {popularHotelItems.length > 0 && (
            <section className="mb-20 animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight leading-tight">
                  <span>
                    Популярные отели
                  </span>
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
                  Отели с наибольшим числом завершенных бронирований
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularHotelItems.map((hotel: any) => (
                  <HotelFeatureCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            </section>
          )}

          {recommendedDestinations.length > 0 && (
            <section className="pb-10 animate-fade-in-up">
              <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight leading-tight">
                  <span>
                    Популярные направления
                  </span>
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
                  Города с наибольшим числом завершенных бронирований
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {recommendedDestinations.map((city: any) => (
                  <CityCard
                    key={city.id || city.name}
                    city={city.name}
                    slug={getCitySlug(city)}
                    image={getCityImagePath(city)}
                    priceFrom={cityPrices[city.id] || 0}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
