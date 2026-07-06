"use client";

import { useQuery } from '@tanstack/react-query';
import { hotelsApi } from '@/lib/api';
import type { Hotel, HotelDetail, SearchParams } from '@/types/api';

export function useHotels() {
  return useQuery({
    queryKey: ['hotels'],
    queryFn: async () => {
      const response = await hotelsApi.getAll();
      return response.data as Hotel[] | null;
    },
  });
}

export function useHotel(id: number) {
  return useQuery({
    queryKey: ['hotel', id],
    queryFn: async () => {
      const response = await hotelsApi.getById(id);
      return response.data as HotelDetail | null;
    },
    enabled: !!id,
  });
}

export function useHotelsByCity(cityId: number) {
  return useQuery({
    queryKey: ['hotels', 'city', cityId],
    queryFn: async () => {
      const response = await hotelsApi.getByCity(cityId);
      return response.data as Hotel[] | null;
    },
    enabled: !!cityId,
  });
}

export function useSearchHotels(searchParams: SearchParams) {
  return useQuery({
    queryKey: ['hotels', 'search', searchParams],
    queryFn: async () => {
      const response = await hotelsApi.search(searchParams);
      return response.data as Hotel[] | null;
    },
    enabled: !!searchParams.cityId,
  });
}

export function useTopRatedHotels(count: number = 10) {
  return useQuery({
    queryKey: ['hotels', 'top-rated', count],
    queryFn: async () => {
      const response = await hotelsApi.getTopRated(count);
      return response.data as Hotel[] | null;
    },
  });
}
