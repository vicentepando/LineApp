import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

export function StarRating({ rating, reportes }: { rating: number; reportes: number }) {
  const normalized = Number.isFinite(rating) ? rating : 0;
  const rounded = Math.max(0, Math.min(5, Math.round(normalized)));
  const averageLabel = reportes > 0 ? ` · ${normalized.toFixed(1)}` : '';
  return (
    <View style={styles.row}>
      <Text style={styles.stars}>{'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}</Text>
      <Text style={styles.text}>{reportes} reportes{averageLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  stars: {
    color: theme.colors.warning,
    fontSize: 16,
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
});
