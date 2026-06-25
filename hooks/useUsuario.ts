import { useQuery } from '@tanstack/react-query';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import type { Usuario } from '@/types';

export function useUsuario(userId?: string) {
  return useQuery({
    queryKey: ['usuario', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId || !hasSupabaseConfig) return null;
      const { data, error } = await supabase.from('usuarios').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      return data as Usuario | null;
    },
  });
}
