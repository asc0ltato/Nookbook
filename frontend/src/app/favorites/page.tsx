"use client";

import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserRole } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { usersApi, citiesApi } from "@/lib/api";
import { FavoritesPageHotelCard } from "@/components/hotels/FavoritesPageHotelCard";
import { useAuth } from "@/contexts/AuthContext";
import type { Hotel } from "@/types/api";
import { getHotelMinPrice } from "@/lib/hotelPrice";

export default function FavoritesPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.User} allowedPaths={["/profile", "/admin", "/manager"]}>
      <FavoritesPageContent />
    </ProtectedRoute>
  );
}

function FavoritesPageContent() {
  const { user } = useAuth();

  const authUserId =
    user?.id == null ? 0 : typeof user.id === "string" ? parseInt(user.id, 10) : Number(user.id);

  const { data: favoritesResponse, isLoading } = useQuery({
    queryKey: ["favorites", authUserId],
    queryFn: () => usersApi.getFavorites(authUserId),
    enabled: Number.isFinite(authUserId) && authUserId > 0,
  });

  const favorites = (favoritesResponse?.data as Hotel[] | undefined) || [];

  const citySlugToId: { [key: string]: number } = {
    'minsk': 1, 'brest': 2, 'vitebsk': 3,
    'gomel': 4, 'grodno': 5, 'mogilev': 6,
  };

  const cityNameToSlug: { [key: string]: string } = {
    'минск': 'minsk', 'брест': 'brest', 'витебск': 'vitebsk',
    'гомель': 'gomel', 'гродно': 'grodno', 'могилев': 'mogilev',
  };

  const citySlugs = [...new Set(favorites.map((f: Hotel) => {
    const cityName = (typeof f.city === 'string' ? f.city : String(f.city)).toLowerCase();
    return cityNameToSlug[cityName] || cityName;
  }))];

  const { data: cityMapData } = useQuery({
    queryKey: ['cities-for-favorites', citySlugs],
    queryFn: async () => {
      const cityMap = new Map<string, { latitude: number; longitude: number }>();
      const cityIds = citySlugs.map(slug => citySlugToId[slug] || 0).filter(id => id > 0);
      const responses = await Promise.all(cityIds.map(id => citiesApi.getById(id)));
      responses.forEach((response) => {
        if (response.data) {
          const city = response.data as any;
          cityMap.set(city.name.toLowerCase(), { latitude: city.latitude, longitude: city.longitude });
        }
      });
      return cityMap;
    },
    enabled: citySlugs.length > 0,
  });

  const cityMap = cityMapData || new Map();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-[calc(var(--header-height)+2rem)] pb-12">
          <div className="container mx-auto px-6 max-w-7xl">
            <h1 className="text-4xl font-bold mb-8">Избранное</h1>
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[calc(var(--header-height)+2rem)] pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Избранное</h1>
          </div>

          {favorites.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Heart className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-semibold mb-4">У вас пока нет избранных отелей</h2>
              <p className="text-muted-foreground mb-8">
                Начните добавлять отели в избранное, чтобы легко находить их позже
              </p>
              <Link href="/hotels">
                <Button className="px-8 h-12 text-base">Найти отели</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {favorites.map((hotel: Hotel) => {
                const cityName = (typeof hotel.city === 'string' ? hotel.city : String(hotel.city)).toLowerCase();
                const citySlug = cityNameToSlug[cityName] || cityName;
                const cityInfo = cityMap.get(cityName) || cityMap.get(citySlug);
                const cityString = typeof hotel.city === 'string' ? hotel.city : String(hotel.city);

                const hotelForCard = {
                  id: String(hotel.id),
                  name: hotel.name,
                  city: cityString,
                  distanceToCenter: 0,
                  rating: (hotel as any).rating ?? 0,
                  reviewCount: (hotel as any).reviewCount ?? 0,
                  price: getHotelMinPrice(hotel as any),
                  imageUrl: (hotel as any).images?.[0] || (hotel as any).imageUrl || '/assets/hotels/block.jpg',
                  images: (hotel as any).images || [],
                  amenities: hotel.amenities || [],
                  stars: (hotel as any).stars ?? 0,
                  latitude: hotel.latitude,
                  longitude: hotel.longitude,
                  description: (hotel as any).description ?? "",
                  address: (hotel as any).address ?? "",
                };

                return (
                  <FavoritesPageHotelCard
                    key={`favorite-hotel-${hotel.id}`}
                    hotel={hotelForCard}
                    cityName={cityString}
                    citySlug={citySlug}
                    cityLatitude={cityInfo?.latitude}
                    cityLongitude={cityInfo?.longitude}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
