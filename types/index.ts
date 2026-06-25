export type Accesibilidad = 'público' | 'pago' | 'permiso' | 'privado';
export type TipoAgua = 'río' | 'lago' | 'arroyo' | 'embalse';
export type FranjaHoraria = 'manana' | 'media_manana' | 'mediodia' | 'tarde' | 'atardecer';
export type TipoLinea = 'flote' | 'hundimiento' | 'sink-tip';
export type TipoMosca = 'Seca' | 'Ninfa' | 'Streamer' | 'Terrestre';
export type TipoTrucha = 'arcoiris' | 'marrón' | 'arroyo';
export type AccionCana = 'fast' | 'medium-fast' | 'medium';
export type NivelUsuario = 'principiante' | 'intermedio' | 'avanzado';
export type ExperienciaPesca = '1-9_meses' | '9-18_meses' | 'mas_2_anos';

export interface Spot {
  id: string;
  nombre: string;
  provincia: string;
  tipo: TipoAgua;
  lat: number;
  lon: number;
  accesibilidad: Accesibilidad;
  especies: string[];
  created_at: string;
}

export interface FichaTecnica {
  id: string;
  spot_id: string;
  temporada_inicio: number | null;
  temporada_fin: number | null;
  franja_horaria: FranjaHoraria | null;
  cana_weight: number;
  cana_largo: number;
  cana_accion: AccionCana;
  linea_weight: number;
  linea_tipo: TipoLinea;
  leader_largo: number;
  tippet_grosor: string;
  moscas: Array<{ nombre: string; tipo: TipoMosca }>;
  truchas: TipoTrucha[];
  created_at?: string;
}

export interface Reporte {
  id: string;
  spot_id: string;
  user_id: string | null;
  fecha: string;
  hora: string;
  condiciones_texto: string | null;
  hubo_pique: boolean;
  mosca_funciono: string | null;
  linea: string | null;
  tippet: string | null;
  cania: string | null;
  trucha: string | null;
  ubicacion: string | null;
  puntaje_estrellas: number | null;
  foto_url: string | null;
  validado: boolean;
  puntos_asignados: number;
  created_at: string;
}

export interface Usuario {
  id: string;
  nombre: string | null;
  email: string | null;
  nivel: NivelUsuario;
  pesca_con_mosca: boolean | null;
  experiencia_pesca: ExperienciaPesca | null;
  puntos_totales: number;
  aportes_validados: number;
}

export interface WeatherData {
  temp: number;
  condicion: string;
  viento_kmh: number;
  humedad: number;
  icon: string;
}
