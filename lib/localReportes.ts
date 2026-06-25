import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reporte } from '@/types';

const STORAGE_KEY = 'lineapp:local-reportes:v1';

export type LocalReporte = Reporte & {
  local?: boolean;
  spots?: {
    nombre: string;
    provincia: string;
  };
};

async function readAllLocalReportes() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalReporte[]) : [];
  } catch {
    return [];
  }
}

export async function getLocalReportesBySpot(spotId: string) {
  const reportes = await readAllLocalReportes();
  return reportes.filter((reporte) => reporte.spot_id === spotId);
}

export async function getLocalReportesByUser(userId: string) {
  const reportes = await readAllLocalReportes();
  return reportes.filter((reporte) => reporte.user_id === userId);
}

export async function saveLocalReporte(reporte: LocalReporte) {
  const reportes = await readAllLocalReportes();
  const nextReportes = [reporte, ...reportes.filter((item) => item.id !== reporte.id)].slice(0, 50);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextReportes));
  return reporte;
}
