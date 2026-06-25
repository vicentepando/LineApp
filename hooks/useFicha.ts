import { useQuery } from '@tanstack/react-query';
import { getDefaultFicha } from '@/lib/defaultFichas';
import { getFranjaHoraria, getTemporadaMeses } from '@/lib/fichaLogic';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import type { FichaTecnica } from '@/types';

export function useFicha(spotId?: string) {
  const franja = getFranjaHoraria();
  const temporada = getTemporadaMeses();

  return useQuery<FichaTecnica | null>({
    queryKey: ['ficha', 'default-v2', spotId, franja, temporada.nombre],
    enabled: Boolean(spotId),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    networkMode: 'offlineFirst',
    queryFn: async () => {
      if (!spotId) return null;
      const defaultFicha = getDefaultFicha(spotId);
      if (!hasSupabaseConfig) return defaultFicha;

      const { data: specific, error: specificError } = await supabase
        .from('fichas_tecnicas')
        .select('*')
        .eq('spot_id', spotId)
        .eq('franja_horaria', franja)
        .in('temporada_inicio', temporada.meses)
        .limit(1)
        .maybeSingle();

      if (specificError) throw specificError;
      if (specific) return specific as FichaTecnica;

      const { data: generic, error: genericError } = await supabase
        .from('fichas_tecnicas')
        .select('*')
        .eq('spot_id', spotId)
        .is('franja_horaria', null)
        .is('temporada_inicio', null)
        .limit(1)
        .maybeSingle();

      if (genericError) throw genericError;
      return (generic as FichaTecnica | null) ?? defaultFicha;
    },
  });
}
