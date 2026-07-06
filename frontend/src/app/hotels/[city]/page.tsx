"use client";

import { useState, useEffect, useMemo, useRef, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { HotelCard } from "@/components/hotels/HotelCard";
import { HotelFilters } from "@/components/hotels/HotelFilters";
import { HotelSort } from "@/components/hotels/HotelSort";
import { HotelMap } from "@/components/hotels/HotelMap";
import { hotelsApi, citiesApi, roomsApi } from "@/lib/api";
import type { Hotel, FiltersState } from "@/types/hotel";
import type { Hotel as ApiHotel, Room } from "@/types/api";
import { calculateDistance } from "@/lib/distanceUtils";
import { toast } from "sonner";

const citySlugToId: { [key: string]: number } = {
  'minsk': 1,
  'brest': 2,
  'vitebsk': 3,
  'gomel': 4,
  'grodno': 5,
  'mogilev': 6,
};

export default function CityHotelsPage({ params }: { params: Promise<{ city: string }> }) {
  return <CityHotelsPageContent params={params} />;
}

function CityHotelsPageContent({ params }: { params: Promise<{ city: string }> }) {
  const { city } = use(params);
  const isBrowser = typeof window !== "undefined";
  
  const loadSearchParams = () => {
    if (!isBrowser) {
      return { checkIn: undefined as Date | undefined, checkOut: undefined as Date | undefined, adults: 2, children: 0, pets: false };
    }
    try {
      const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
      if (history.length > 0) {
        const lastSearch = history[0];
        const checkIn = lastSearch.checkIn ? new Date(lastSearch.checkIn) : undefined;
        const checkOut = lastSearch.checkOut ? new Date(lastSearch.checkOut) : undefined;
        const adults = lastSearch.adults || 2;
        const children = lastSearch.children || 0;
        const pets = !!lastSearch.pets;
        return { checkIn, checkOut, adults, children, pets };
      }
    } catch (error) {
      console.error("Error loading search params:", error);
    }
    return { checkIn: undefined as Date | undefined, checkOut: undefined as Date | undefined, adults: 2, children: 0, pets: false };
  };

  const [searchParams] = useState(loadSearchParams);
  
  const cityId = citySlugToId[city.toLowerCase()] || 0;

  const hasSearchDates = !!searchParams.checkIn && !!searchParams.checkOut;
  const totalGuests = searchParams.adults + searchParams.children;

  const formatDateForApi = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const loadFiltersFromStorage = (): FiltersState => {
    if (!isBrowser) {
      return {
        priceRange: [0, 1000] as [number, number],
        minPrice: "0",
        maxPrice: "1000",
        meals: [],
        rating: 0,
        stars: [],
        hotelAmenities: [],
        roomAmenities: [],
        bedType: "any",
        distanceRange: [0, 15] as [number, number],
        minDistance: "0",
        maxDistance: "15",
        searchQuery: ""
      };
    }
    try {
      const savedFilters = localStorage.getItem(`filters_${city}`);
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        return {
          priceRange: (Array.isArray(parsed.priceRange) && parsed.priceRange.length === 2) 
            ? [parsed.priceRange[0] as number, parsed.priceRange[1] as number] as [number, number]
            : [0, 1000] as [number, number],
          minPrice: parsed.minPrice || "0",
          maxPrice: parsed.maxPrice || "1000",
          meals: parsed.meals || [],
          rating: parsed.rating || 0,
          stars: parsed.stars || [],
          hotelAmenities: parsed.hotelAmenities || [],
          roomAmenities: parsed.roomAmenities || [],
          bedType: parsed.bedType || "any",
          distanceRange: (Array.isArray(parsed.distanceRange) && parsed.distanceRange.length === 2)
            ? [parsed.distanceRange[0] as number, parsed.distanceRange[1] as number] as [number, number]
            : [0, 15] as [number, number],
          minDistance: parsed.minDistance || "0",
          maxDistance: parsed.maxDistance || "15",
          searchQuery: parsed.searchQuery || ""
        };
      }
    } catch (error) {
      console.error("Error loading filters from storage:", error);
    }
    return {
      priceRange: [0, 1000] as [number, number],
      minPrice: "0",
      maxPrice: "1000",
      meals: [],
      rating: 0,
      stars: [],
      hotelAmenities: [],
      roomAmenities: [],
      bedType: "any",
      distanceRange: [0, 15] as [number, number],
      minDistance: "0",
      maxDistance: "15",
      searchQuery: ""
    };
  };
  
  const [sortBy, setSortBy] = useState(() => {
    if (!isBrowser) {
      return "popular";
    }
    try {
      const saved = localStorage.getItem(`sortBy_${city}`);
      return saved || "popular";
    } catch {
      return "popular";
    }
  });
  const [filters, setFilters] = useState<FiltersState>(loadFiltersFromStorage);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedHotelId, setHighlightedHotelId] = useState<string | null>(null);
  const hotelsPerPage = 7;

  const cityMapping: { [key: string]: string } = {
    minsk: "Минск",
    brest: "Брест", 
    vitebsk: "Витебск",
    gomel: "Гомель",
    grodno: "Гродно",
    mogilev: "Могилев"
  };

  let citySlug = city;
  let cityName = city;
  
  try {
    const decoded = decodeURIComponent(city);
    if (cityMapping[decoded]) {
      cityName = cityMapping[decoded];
    } else if (cityMapping[city]) {
      cityName = cityMapping[city];
    } else {
      cityName = decoded.charAt(0).toUpperCase() + decoded.slice(1);
    }
  } catch {
    cityName = city.charAt(0).toUpperCase() + city.slice(1);
  }

  const { data: cityResponse } = useQuery({
    queryKey: ['city', cityId],
    queryFn: () => citiesApi.getById(cityId),
    enabled: cityId > 0,
  });

  const cityLatitude = (cityResponse?.data as any)?.latitude;
  const cityLongitude = (cityResponse?.data as any)?.longitude;

  useEffect(() => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(`filters_${city}`, JSON.stringify(filters));
    } catch (error) {
      console.error("Error saving filters to storage:", error);
    }
  }, [filters, city]);

  useEffect(() => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(`sortBy_${city}`, sortBy);
    } catch (error) {
      console.error("Error saving sortBy to storage:", error);
    }
  }, [sortBy, city]);

  const resetFilters = () => {
    const defaultFilters: FiltersState = {
      priceRange: [0, 1000] as [number, number],
      minPrice: "0",
      maxPrice: "1000",
      meals: [],
      rating: 0,
      stars: [],
      hotelAmenities: [],
      roomAmenities: [],
      bedType: "any",
      distanceRange: [0, 15] as [number, number],
      minDistance: "0",
      maxDistance: "15",
      searchQuery: ""
    };
    setFilters(defaultFilters);
    try {
      localStorage.setItem(`filters_${city}`, JSON.stringify(defaultFilters));
    } catch (error) {
      console.error("Error saving filters to storage:", error);
    }
  };

  const { data: hotelsResponse, isLoading, error } = useQuery({
    queryKey: [
      "hotels",
      city,
      hasSearchDates ? formatDateForApi(searchParams.checkIn as Date) : null,
      hasSearchDates ? formatDateForApi(searchParams.checkOut as Date) : null,
      hasSearchDates ? totalGuests : null,
      searchParams.pets,
      filters.hotelAmenities,
    ],
    queryFn: () => {
      if (hasSearchDates && totalGuests > 0) {
        return hotelsApi.search({
          cityId: cityId,
          checkInDate: formatDateForApi(searchParams.checkIn as Date),
          checkOutDate: formatDateForApi(searchParams.checkOut as Date),
          guestCount: totalGuests,
          amenityNames: searchParams.pets ? [...filters.hotelAmenities, "Можно с питомцами"] : filters.hotelAmenities,
        });
      }
      return hotelsApi.getByCity(cityId);
    },
    enabled: cityId > 0,
  });

  const hotelsList = Array.isArray(hotelsResponse?.data) ? hotelsResponse.data as ApiHotel[] : [];
  const { data: roomsData } = useQuery({
    queryKey: ['rooms', 'all', city, hotelsList.map(h => h.id).join(',')],
    queryFn: async () => {
      const roomsMap = new Map<number, Room[]>();
      await Promise.all(
        hotelsList.map(async (hotel) => {
          try {
            const hotelId = typeof hotel.id === 'string' ? parseInt(hotel.id, 10) : hotel.id;
            const response = await roomsApi.getByHotel(hotelId);
            if (response.success && Array.isArray(response.data)) {
              roomsMap.set(hotelId, response.data as Room[]);
            }
          } catch (error) {
            console.error(`Error fetching rooms for hotel ${hotel.id}:`, error);
          }
        })
      );
      return roomsMap;
    },
    enabled: hotelsList.length > 0,
  });

  const roomsMap = roomsData || new Map<number, Room[]>();

  const allHotels: Hotel[] = (Array.isArray(hotelsResponse?.data) ? hotelsResponse.data : []).map((hotel: ApiHotel) => {
    const hotelId = typeof hotel.id === "string" ? parseInt(hotel.id, 10) : hotel.id;
    const hotelRooms = roomsMap.get(hotelId) || [];
    const minRoomTypePrice = (() => {
      if (!hotelRooms.length) {
        return Number(hotel.price ?? hotel.pricePerNight ?? 0);
      }

      const minByType = new Map<string, number>();
      hotelRooms.forEach((room) => {
        const key = (room.roomType || room.type || `type-${room.id}`).trim();
        const price = Number(room.price ?? room.pricePerNight ?? 0);
        if (!Number.isFinite(price) || price <= 0) return;
        const prev = minByType.get(key);
        if (prev === undefined || price < prev) {
          minByType.set(key, price);
        }
      });

      if (!minByType.size) {
        return Number(hotel.price ?? hotel.pricePerNight ?? 0);
      }

      return Math.min(...Array.from(minByType.values()));
    })();

    return {
    id: hotel.id.toString(),
    name: hotel.name,
    city: typeof hotel.city === 'string' ? hotel.city : cityName,
    distanceToCenter: hotel.distanceToCenter || 0,
    rating: hotel.rating,
    reviewCount: hotel.reviewCount,
    price: minRoomTypePrice,
    imageUrl: hotel.imageUrl || hotel.images?.[0] || "/assets/cities/minsk.jpg",
    images: hotel.images || (hotel.imageUrl ? [hotel.imageUrl] : []),
    amenities: hotel.amenities || [],
    stars: hotel.stars,
    latitude: hotel.latitude,
    longitude: hotel.longitude,
  };
  }) || [];

  const filteredHotels = useMemo(() => {
    const normalizeAmenity = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

    return allHotels.filter((hotel) => {
      if (filters.searchQuery && !hotel.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }
      
      if (filters.priceRange[0] > 0 && hotel.price < filters.priceRange[0]) return false;
      if (filters.priceRange[1] < 1000 && hotel.price > filters.priceRange[1]) return false;
      
      if (filters.rating > 0 && hotel.rating < filters.rating) return false;
      
      if (filters.stars.length > 0 && !filters.stars.includes(hotel.stars)) return false;
      
      if (filters.hotelAmenities.length > 0) {
        const normalizedHotelAmenities = (hotel.amenities || []).map(normalizeAmenity);
        const hasAllAmenities = filters.hotelAmenities.every(amenity =>
          normalizedHotelAmenities.includes(normalizeAmenity(amenity))
        );
        if (!hasAllAmenities) return false;
      }

      if (searchParams.pets) {
        const normalizedHotelAmenities = (hotel.amenities || []).map(normalizeAmenity);
        const allowsPets = normalizedHotelAmenities.some((amenity) => amenity.includes("питом") || amenity.includes("живот"));
        if (!allowsPets) return false;
      }
      
      const calculatedDistance = (() => {
        if (cityLatitude && cityLongitude && hotel.latitude && hotel.longitude) {
          return calculateDistance(
            cityLatitude,
            cityLongitude,
            hotel.latitude,
            hotel.longitude
          );
        }
        return 0;
      })();
      
      if (filters.distanceRange[0] > 0 && calculatedDistance < filters.distanceRange[0]) return false;
      if (filters.distanceRange[1] < 15 && calculatedDistance > filters.distanceRange[1]) return false;
      
      const hotelRooms = roomsMap.get(parseInt(hotel.id)) || [];
      if (filters.bedType !== "any" || filters.roomAmenities.length > 0) {
        const hasMatchingRoom = hotelRooms.some((room) => {
          if (filters.bedType !== "any") {
            const bedTypeMatch = filters.bedType === "Односпальная" 
              ? room.bedCount === 1
              : room.bedCount === 2;
            
            if (!bedTypeMatch) return false;
          }
          
          if (filters.roomAmenities.length > 0) {
            const roomAmenities = (room.amenities || []).map((a: string) => normalizeAmenity(a));
            const hasAllRoomAmenities = filters.roomAmenities.every(amenity =>
              roomAmenities.includes(normalizeAmenity(amenity))
            );
            if (!hasAllRoomAmenities) return false;
          }
          
          return true;
        });
        
        if (!hasMatchingRoom) return false;
      }
      
      return true;
    });
  }, [allHotels, filters, cityLatitude, cityLongitude, roomsMap, searchParams.pets]);

  const hotels = useMemo(() => {
    const sorted = [...filteredHotels].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "popular":
        default:
          return b.reviewCount - a.reviewCount;
      }
    });
    return sorted;
  }, [filteredHotels, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [city, sortBy, filters]);

  const totalPages = Math.max(1, Math.ceil(hotels.length / hotelsPerPage));
  const paginatedHotels = useMemo(() => {
    const start = (currentPage - 1) * hotelsPerPage;
    return hotels.slice(start, start + hotelsPerPage);
  }, [hotels, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (error) {
      toast.error("Ошибка загрузки отелей");
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex relative" style={{ marginTop: '60px' }}>

        <div className="flex-1 pr-[530px]">
          <div className="container mx-auto max-w-full px-0">
            <div className="px-0 mb-6 pt-6">
              <div className="mb-6 px-6">
                <div className="flex items-center justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent whitespace-nowrap">
                      Отели в {cityName === "Могилев" ? "Могилеве" : cityName}
                    </h1>
                    <p className="text-muted-foreground">
                      {isLoading ? "Загрузка..." : (() => {
                        const count = hotels.length;
                      if (count === 0) return "Найдено 0 отелей";
                      if (count === 1) return "Найден 1 отель";
                      if (count >= 2 && count <= 4) return `Найдено ${count} отеля`;
                      return `Найдено ${count} отелей`;
                      })()}
                    </p>
                  </div>
                  <div className="flex-[2.1]">
                    <div className="relative w-[640px]">
                      <input
                        type="text"
                        placeholder="Поиск по названию отеля"
                        value={filters.searchQuery}
                        onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                        className="w-full pr-10 px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base h-12"
                      />
                      {filters.searchQuery && (
                        <button
                          type="button"
                          onClick={() => setFilters({ ...filters, searchQuery: "" })}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        >
                          <span className="text-lg leading-none">×</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <HotelSort sortBy={sortBy} onSortChange={setSortBy} />
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-lg border-2 border-border bg-card hover:bg-muted hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/30 transition-colors text-foreground text-sm h-10 whitespace-nowrap"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-6 px-6">
              <aside className="flex-shrink-0">
                <HotelFilters filters={filters} onFiltersChange={setFilters} />
              </aside>

              <div className="flex-1">
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : hotels.length === 0 ? (
                  <div className="flex justify-start py-20 w-full min-w-[600px]">
                  <div className="ml-[180px] text-center">
                    <p className="text-xl text-muted-foreground mb-4">Отели не найдены</p>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">Попробуйте изменить параметры поиска</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mr-6">
                    {paginatedHotels.map((hotel) => (
                      <HotelCard 
                        key={hotel.id} 
                        hotel={hotel} 
                        cityName={cityName} 
                        citySlug={citySlug}
                        cityLatitude={cityLatitude}
                        cityLongitude={cityLongitude}
                        onShowOnMap={(hotelId) => {
                          setHighlightedHotelId(null);
                          requestAnimationFrame(() => setHighlightedHotelId(hotelId));
                        }}
                        isHighlightedOnMap={highlightedHotelId === String(hotel.id)}
                      />
                    ))}
                  </div>
                )}
                {hotels.length > hotelsPerPage && (
                  <div className="mt-8 mr-6 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md border border-border bg-card text-sm disabled:opacity-50"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Назад
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Страница {currentPage} из {totalPages}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md border border-border bg-card text-sm disabled:opacity-50"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Далее
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-[60px] right-0 w-[430px] flex-shrink-0 z-10 border-l border-border bg-card"
            style={{ height: 'calc(100vh - 60px)', maxHeight: 'calc(100vh - 60px)', marginBottom: '-55px'}}>
          <HotelMap 
            hotels={paginatedHotels} 
            cityName={cityName}
            citySlug={citySlug}
            cityLatitude={cityLatitude}
            cityLongitude={cityLongitude}
            highlightedHotelId={highlightedHotelId}
            onHotelClick={(hotelId) => {
              window.location.href = `/hotels/${citySlug}/${hotelId}`;
            }}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
