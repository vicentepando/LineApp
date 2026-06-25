import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import type { Spot } from '@/types';

export function SpotMap({
  spots,
  onSpotPress,
}: {
  spots: Spot[];
  onSpotPress: (spot: Spot) => void;
  onMapPress: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spots de pesca</Text>
      <Text style={styles.subtitle}>La vista de mapa Google corre en iOS y Android. En web podés probar el flujo con esta lista.</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {spots.map((spot) => (
          <Pressable key={spot.id} style={styles.card} onPress={() => onSpotPress(spot)}>
            <Text style={styles.cardTitle}>{spot.nombre}</Text>
            <Text style={styles.cardText}>{spot.provincia} · {spot.tipo} · {spot.accesibilidad}</Text>
            <Text style={styles.cardText}>{spot.especies.join(', ')}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 126,
  },
  title: {
    color: theme.colors.textMain,
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  cardTitle: {
    color: theme.colors.textMain,
    fontSize: 16,
    fontWeight: '800',
  },
  cardText: {
    color: theme.colors.textSecondary,
  },
});
