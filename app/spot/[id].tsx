import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { FichaTecnicaBlock } from '@/components/sheet/FichaTecnica';
import { ReportesList } from '@/components/sheet/ReportesList';
import { WeatherBlock } from '@/components/sheet/WeatherBlock';
import { theme } from '@/constants/theme';
import { useSpots } from '@/hooks/useSpots';

export default function SpotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: spots = [], isLoading } = useSpots();
  const spot = spots.find((item) => item.id === id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No encontramos ese spot.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{spot.nombre}</Text>
      <Text style={styles.text}>{spot.provincia} · {spot.tipo}</Text>
      <Badge value={spot.accesibilidad} />
      <WeatherBlock lat={spot.lat} lon={spot.lon} />
      <FichaTecnicaBlock spotId={spot.id} />
      <ReportesList spotId={spot.id} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.textMain,
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    fontWeight: '700',
  },
  text: {
    color: theme.colors.textSecondary,
  },
});
