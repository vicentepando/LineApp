import { useQuery } from '@tanstack/react-query';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import type { Spot } from '@/types';

export const SPOTS_QUERY_KEY = ['spots', 'amba-v2'] as const;

const AMBA_SPOT_OVERRIDES: Record<string, Partial<Spot>> = {
  '00000000-0000-4000-8000-000000000001': {
    nombre: 'Delta del Tigre - Tres Bocas',
    provincia: 'Buenos Aires',
    tipo: 'río',
    lat: -34.418,
    lon: -58.579,
    accesibilidad: 'público',
    especies: ['dorado', 'tararira', 'chafalote'],
  },
  '00000000-0000-4000-8000-000000000002': {
    nombre: 'Río Luján - San Fernando',
    provincia: 'Buenos Aires',
    tipo: 'río',
    lat: -34.443,
    lon: -58.548,
    accesibilidad: 'público',
    especies: ['dorado', 'tararira', 'bagre'],
  },
  '00000000-0000-4000-8000-000000000003': {
    nombre: 'Arroyo Abra Vieja',
    provincia: 'Buenos Aires',
    tipo: 'arroyo',
    lat: -34.391,
    lon: -58.623,
    accesibilidad: 'público',
    especies: ['tararira', 'dorado', 'chafalote'],
  },
  '00000000-0000-4000-8000-000000000004': {
    nombre: 'Costanera Norte - Aeroparque',
    provincia: 'CABA',
    tipo: 'río',
    lat: -34.556,
    lon: -58.391,
    accesibilidad: 'público',
    especies: ['pejerrey', 'tararira', 'dorado'],
  },
  '00000000-0000-4000-8000-000000000005': {
    nombre: 'Costanera Sur - Reserva',
    provincia: 'CABA',
    tipo: 'río',
    lat: -34.612,
    lon: -58.331,
    accesibilidad: 'público',
    especies: ['pejerrey', 'dorado', 'tararira'],
  },
  '00000000-0000-4000-8000-000000000006': {
    nombre: 'Quilmes - Ribera',
    provincia: 'Buenos Aires',
    tipo: 'río',
    lat: -34.705,
    lon: -58.197,
    accesibilidad: 'público',
    especies: ['pejerrey', 'tararira', 'dorado'],
  },
  '00000000-0000-4000-8000-000000000007': {
    nombre: 'Hudson - Arroyo Las Conchitas',
    provincia: 'Buenos Aires',
    tipo: 'arroyo',
    lat: -34.79,
    lon: -58.139,
    accesibilidad: 'público',
    especies: ['tararira', 'dorado', 'bagre'],
  },
  '00000000-0000-4000-8000-000000000008': {
    nombre: 'Berisso - Palo Blanco',
    provincia: 'Buenos Aires',
    tipo: 'río',
    lat: -34.854,
    lon: -57.803,
    accesibilidad: 'público',
    especies: ['pejerrey', 'dorado', 'tararira'],
  },
  '00000000-0000-4000-8000-000000000009': {
    nombre: 'Punta Lara - Boca Cerrada',
    provincia: 'Buenos Aires',
    tipo: 'río',
    lat: -34.807,
    lon: -57.952,
    accesibilidad: 'público',
    especies: ['pejerrey', 'tararira', 'dorado'],
  },
  '00000000-0000-4000-8000-000000000010': {
    nombre: 'Escobar - Paraná de las Palmas',
    provincia: 'Buenos Aires',
    tipo: 'río',
    lat: -34.281,
    lon: -58.785,
    accesibilidad: 'público',
    especies: ['dorado', 'tararira', 'surubí chico'],
  },
};

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
      return (data ?? [])
        .map((spot) => {
          const normalizedSpot = {
            ...spot,
            lat: Number(spot.lat),
            lon: Number(spot.lon),
          } as Spot;

          return {
            ...normalizedSpot,
            ...AMBA_SPOT_OVERRIDES[normalizedSpot.id],
          };
        })
        .filter(isInArgentinaBounds) as Spot[];
    },
  });
}
