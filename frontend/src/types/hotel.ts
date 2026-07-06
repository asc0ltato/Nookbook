export interface Hotel {
  id: string;
  name: string;
  city: string;
  distanceToCenter: number;
  rating: number;
  reviewCount: number;
  price: number;
  imageUrl: string;
  images?: string[];
  amenities: string[];
  stars: number;
  latitude?: number;
  longitude?: number;
  hasFood?: boolean;
  foodOptions?: string[];
}

export interface FiltersState {
  priceRange: [number, number];
  minPrice: string;
  maxPrice: string;
  meals: string[];
  rating: number;
  stars: number[];
  hotelAmenities: string[];
  roomAmenities: string[];
  bedType: string;
  distanceRange: [number, number];
  minDistance: string;
  maxDistance: string;
  searchQuery: string;
}
