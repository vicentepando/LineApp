import type { WeatherData } from '@/types';

const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

const iconForCondition = (condition: string, windKmh: number) => {
  const normalized = condition.toLowerCase();
  if (windKmh > 35) return '💨';
  if (normalized.includes('rain') || normalized.includes('lluvia')) return '🌧️';
  if (normalized.includes('cloud') || normalized.includes('nube')) return '☁️';
  if (normalized.includes('clear') || normalized.includes('despejado')) return '☀️';
  return '🌤️';
};

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  if (!apiKey) throw new Error('Falta EXPO_PUBLIC_OPENWEATHER_API_KEY');

  const oneCallUrl = new URL('https://api.openweathermap.org/data/3.0/onecall');
  oneCallUrl.searchParams.set('lat', String(lat));
  oneCallUrl.searchParams.set('lon', String(lon));
  oneCallUrl.searchParams.set('units', 'metric');
  oneCallUrl.searchParams.set('lang', 'es');
  oneCallUrl.searchParams.set('exclude', 'minutely,hourly,daily,alerts');
  oneCallUrl.searchParams.set('appid', apiKey);

  const response = await fetch(oneCallUrl.toString());
  if (response.ok) {
    const json = await response.json();
    const current = json.current;
    const condicion = current.weather?.[0]?.description ?? 'Sin dato';
    const vientoKmh = Math.round((current.wind_speed ?? 0) * 3.6);

    return {
      temp: Math.round(current.temp),
      condicion,
      viento_kmh: vientoKmh,
      humedad: current.humidity ?? 0,
      icon: iconForCondition(condicion, vientoKmh),
    };
  }

  const fallbackUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
  fallbackUrl.searchParams.set('lat', String(lat));
  fallbackUrl.searchParams.set('lon', String(lon));
  fallbackUrl.searchParams.set('units', 'metric');
  fallbackUrl.searchParams.set('lang', 'es');
  fallbackUrl.searchParams.set('appid', apiKey);

  const fallbackResponse = await fetch(fallbackUrl.toString());
  if (!fallbackResponse.ok) throw new Error('No se pudo cargar el clima');

  const fallbackJson = await fallbackResponse.json();
  const condicion = fallbackJson.weather?.[0]?.description ?? 'Sin dato';
  const vientoKmh = Math.round((fallbackJson.wind?.speed ?? 0) * 3.6);
  return {
    temp: Math.round(fallbackJson.main?.temp ?? 0),
    condicion,
    viento_kmh: vientoKmh,
    humedad: fallbackJson.main?.humidity ?? 0,
    icon: iconForCondition(condicion, vientoKmh),
  };
}
