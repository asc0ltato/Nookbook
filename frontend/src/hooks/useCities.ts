"use client";

import { useQuery } from '@tanstack/react-query';
import { citiesApi } from '@/lib/api';
import type { City } from '@/types/api';

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await citiesApi.getAll();
      return response.data as City[] | null;
    },
  });
}

export function useCity(slug: string) {
  return useQuery({
    queryKey: ['city', slug],
    queryFn: async () => {
      const response = await citiesApi.getBySlug(slug);
      return response.data as City | null;
    },
    enabled: !!slug,
  });
}

export function useCityWithHotels(slug: string) {
  return useQuery({
    queryKey: ['city', 'with-hotels', slug],
    queryFn: async () => {
      const response = await citiesApi.getWithHotels(slug);
      return response.data;
    },
    enabled: !!slug,
  });
}
