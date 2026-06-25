import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { useReportes } from '@/hooks/useReportes';
import { FreshnessIndicator } from '@/components/ui/FreshnessIndicator';

export function hasRecentPique(reportes: Array<{ hubo_pique: boolean; created_at: string }>) {
  const cutoff = Date.now() - 1000 * 60 * 60 * 72;
  return reportes.some((reporte) => reporte.hubo_pique && new Date(reporte.created_at).getTime() >= cutoff);
}

export function ReportesList({ spotId }: { spotId: string }) {
  const { data = [] } = useReportes(spotId);
  const latestValidated = data.find((reporte) => reporte.validado && reporte.condiciones_texto);

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Tip de la comunidad</Text>
      {latestValidated ? (
        <View style={styles.tip}>
          <Text style={styles.tipText}>{latestValidated.condiciones_texto}</Text>
          <FreshnessIndicator dateIso={latestValidated.created_at} />
        </View>
      ) : (
        <Text style={styles.empty}>Todavía no hay tips validados para este spot.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textMain,
    fontWeight: '800',
    fontSize: 16,
  },
  tip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tipText: {
    color: theme.colors.textMain,
    lineHeight: 20,
  },
  empty: {
    color: theme.colors.textSecondary,
  },
});
