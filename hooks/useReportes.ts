import { useQuery } from '@tanstack/react-query';
import { getLocalReportesBySpot, getLocalReportesByUser, type LocalReporte } from '@/lib/localReportes';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import type { Reporte } from '@/types';

export function useReportes(spotId?: string) {
  return useQuery({
    queryKey: ['reportes', spotId],
    enabled: Boolean(spotId),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 60 * 6,
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!spotId) return [];
      const localReportes = await getLocalReportesBySpot(spotId);
      if (!hasSupabaseConfig) return localReportes;
      const { data, error } = await supabase
        .from('reportes')
        .select('*')
        .eq('spot_id', spotId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return localReportes;
      return [...localReportes, ...((data ?? []) as Reporte[])];
    },
  });
}

export function useMisReportesValidados(userId?: string) {
  return useQuery({
    queryKey: ['mis-reportes-validados', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];
      const localReportes = await getLocalReportesByUser(userId);
      if (!hasSupabaseConfig) return localReportes;
      const { data, error } = await supabase
        .from('reportes')
        .select('*, spots(nombre, provincia)')
        .eq('user_id', userId)
        .eq('validado', true)
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) return localReportes;
      return [...localReportes, ...((data ?? []) as LocalReporte[])];
    },
  });
}
