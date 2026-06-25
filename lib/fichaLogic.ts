import type { FranjaHoraria } from '@/types';

export function getFranjaHoraria(date = new Date()): FranjaHoraria {
  const hour = date.getHours();
  if (hour >= 6 && hour <= 9) return 'manana';
  if (hour >= 10 && hour <= 11) return 'media_manana';
  if (hour >= 12 && hour <= 15) return 'mediodia';
  if (hour >= 16 && hour <= 18) return 'tarde';
  if (hour >= 19 && hour <= 21) return 'atardecer';
  return 'manana';
}

export function getTemporadaMeses(date = new Date()) {
  const month = date.getMonth() + 1;
  if ([12, 1, 2].includes(month)) return { nombre: 'verano', meses: [12, 1, 2] };
  if ([3, 4, 5].includes(month)) return { nombre: 'otoño', meses: [3, 4, 5] };
  if ([6, 7, 8].includes(month)) return { nombre: 'invierno', meses: [6, 7, 8] };
  return { nombre: 'primavera', meses: [9, 10, 11] };
}
