import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { useWeather } from '@/hooks/useWeather';

const windLabel = (wind: number) => {
  if (wind < 20) return { text: 'Condiciones buenas 🟢', color: theme.colors.success };
  if (wind <= 35) return { text: 'Condiciones regulares 🟡', color: theme.colors.warning };
  return { text: 'Viento fuerte 🔴', color: theme.colors.danger };
};

export function WeatherBlock({ lat, lon }: { lat: number; lon: number }) {
  const { data, isLoading, error } = useWeather(lat, lon);

  if (isLoading) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.box}>
        <Text style={styles.error}>Clima no disponible. Revisá la API key de OpenWeather.</Text>
      </View>
    );
  }

  const label = windLabel(data.viento_kmh);

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Clima ahora</Text>
      <View style={styles.grid}>
        <Text style={styles.metric}>{data.icon} {data.temp}°C</Text>
        <Text style={styles.metric}>Viento {data.viento_kmh} km/h</Text>
        <Text style={styles.metric}>Humedad {data.humedad}%</Text>
        <Text style={styles.metric}>{data.condicion}</Text>
      </View>
      <Text style={[styles.status, { color: label.color }]}>{label.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textMain,
    fontWeight: '800',
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metric: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    minWidth: '46%',
  },
  status: {
    fontWeight: '800',
  },
  error: {
    color: theme.colors.textSecondary,
  },
});
