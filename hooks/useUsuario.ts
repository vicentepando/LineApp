import { useQuery } from '@tanstack/react-query';
import { getLocalReportesByUser } from '@/lib/localReportes';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import type { Usuario } from '@/types';

export function useUsuario(userId?: string) {
  return useQuery({
    queryKey: ['usuario', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const localReportes = await getLocalReportesByUser(userId);
      const localPoints = localReportes.reduce((total, reporte) => total + (reporte.puntos_asignados ?? 0), 0);
      const localAportes = localReportes.filter((reporte) => (reporte.puntos_asignados ?? 0) > 0).length;
      if (!hasSupabaseConfig) return null;
      const { data, error } = await supabase.from('usuarios').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const usuario = data as Usuario;
      return {
        ...usuario,
        puntos_totales: usuario.puntos_totales + localPoints,
        aportes_validados: usuario.aportes_validados + localAportes,
      };
    },
  });
}
