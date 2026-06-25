import { useQuery } from '@tanstack/react-query';
import { fetchWeather } from '@/lib/openweather';

export function useWeather(lat?: number, lon?: number) {
  return useQuery({
    queryKey: ['weather', lat, lon],
    enabled: typeof lat === 'number' && typeof lon === 'number',
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 6,
    networkMode: 'offlineFirst',
    queryFn: () => fetchWeather(lat!, lon!),
  });
}
