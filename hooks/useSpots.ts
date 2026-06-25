import { useQuery } from '@tanstack/react-query';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import type { Spot } from '@/types';

export const SPOTS_QUERY_KEY = ['spots', 'argentina-only-v1'] as const;

function isInArgentinaBounds(spot: Spot) {
  return spot.lat >= -56 && spot.lat <= -21 && spot.lon >= -74 && spot.lon <= -53;
}

export function useSpots() {
  return useQuery({
    queryKey: SPOTS_QUERY_KEY,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!hasSupabaseConfig) throw new Error('Faltan las variables de Supabase en .env');
      const { data, error } = await supabase.from('spots').select('*').order('nombre');
      if (error) throw error;
      return (data ?? []).map((spot) => ({
        ...spot,
        lat: Number(spot.lat),
        lon: Number(spot.lon),
      })).filter(isInArgentinaBounds) as Spot[];
    },
  });
}
