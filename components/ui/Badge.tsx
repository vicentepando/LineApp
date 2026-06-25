import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import type { Accesibilidad } from '@/types';

const labels: Record<Accesibilidad, string> = {
  público: 'Público',
  pago: 'Pago',
  permiso: 'Permiso municipal',
  privado: 'Privado',
};

const colors: Record<Accesibilidad, { bg: string; text: string }> = {
  público: { bg: theme.colors.accessPublicBg, text: theme.colors.accessPublicText },
  pago: { bg: theme.colors.accessPaidBg, text: theme.colors.accessPaidText },
  permiso: { bg: theme.colors.accessPermitBg, text: theme.colors.accessPermitText },
  privado: { bg: theme.colors.accessPrivateBg, text: theme.colors.accessPrivateText },
};

export function Badge({ value }: { value: Accesibilidad }) {
  const color = colors[value];
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{labels[value]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  text: {
    fontWeight: '700',
    fontSize: 12,
  },
});
