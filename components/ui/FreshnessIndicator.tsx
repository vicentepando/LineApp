import { StyleSheet, Text } from 'react-native';
import { theme } from '@/constants/theme';

export function getFreshnessLabel(dateIso?: string | null) {
  if (!dateIso) return '⚪ Histórico';
  const hours = (Date.now() - new Date(dateIso).getTime()) / (1000 * 60 * 60);
  if (hours < 72) return '🟢 Fresco';
  if (hours < 24 * 7) return '🟡 Reciente';
  return '⚪ Histórico';
}

export function FreshnessIndicator({ dateIso }: { dateIso?: string | null }) {
  return <Text style={styles.text}>{getFreshnessLabel(dateIso)}</Text>;
}

const styles = StyleSheet.create({
  text: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});
