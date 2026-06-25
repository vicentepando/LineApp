import BottomSheet, { BottomSheetScrollView, useBottomSheetTimingConfigs } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { forwardRef, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useReportes } from '@/hooks/useReportes';
import { useAuthStore } from '@/stores/authStore';
import type { Spot } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { WeatherBlock } from '@/components/sheet/WeatherBlock';
import { FichaTecnicaBlock } from '@/components/sheet/FichaTecnica';
import { ReportesList } from '@/components/sheet/ReportesList';
import { hasRecentPique } from '@/components/sheet/ReportesList';
import { ReportModal } from '@/components/sheet/ReportModal';

export const SpotSheet = forwardRef<BottomSheet, { spot: Spot | null; onToast: (message: string) => void }>(
  ({ spot, onToast }, ref) => {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const setAuthMessage = useAuthStore((state) => state.setAuthMessage);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const snapPoints = useMemo(() => ['62%'], []);
    const animationConfigs = useBottomSheetTimingConfigs({
      duration: 350,
      easing: Easing.bezier(0.32, 0.72, 0.3, 1),
    });
    const { data: reportes = [] } = useReportes(spot?.id);
    const ratedReportes = useMemo(
      () => reportes.filter((reporte) => typeof reporte.puntaje_estrellas === 'number' && reporte.puntaje_estrellas >= 1 && reporte.puntaje_estrellas <= 5),
      [reportes],
    );
    const averageRating = useMemo(() => {
      if (ratedReportes.length === 0) return 0;
      return ratedReportes.reduce((total, reporte) => total + (reporte.puntaje_estrellas ?? 0), 0) / ratedReportes.length;
    }, [ratedReportes]);

    const openReport = () => {
      if (!user) {
        setAuthMessage('Necesitás una cuenta para aportar');
        router.push('/login');
        return;
      }
      setReportModalVisible(true);
    };

    return (
      <>
        <BottomSheet
          ref={ref}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          animateOnMount={false}
          animationConfigs={animationConfigs}
          backgroundStyle={styles.sheetBackground}
          handleIndicatorStyle={styles.handle}
        >
          {spot ? (
            <BottomSheetScrollView
              contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom + theme.spacing.xl, theme.spacing.xl) },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.titleBlock}>
                  <Text style={styles.title}>{spot.nombre}</Text>
                  <Text style={styles.province}>{spot.provincia}</Text>
                </View>
                <Badge value={spot.accesibilidad} />
              </View>

              <View style={styles.ratingRow}>
                <StarRating rating={averageRating} reportes={ratedReportes.length} />
                {hasRecentPique(reportes) ? <Text style={styles.recent}>Pique reciente 🟢</Text> : null}
              </View>

              <WeatherBlock lat={spot.lat} lon={spot.lon} />
              <FichaTecnicaBlock spotId={spot.id} />
              <ReportesList spotId={spot.id} />

              <Pressable style={styles.button} onPress={openReport}>
                <Text style={styles.buttonText}>Subir reporte</Text>
              </Pressable>
            </BottomSheetScrollView>
          ) : (
            <View style={[styles.content, { paddingBottom: Math.max(insets.bottom + theme.spacing.xl, theme.spacing.xl) }]}>
              <Text style={styles.province}>Elegí un spot para ver la ficha.</Text>
            </View>
          )}
        </BottomSheet>

        {spot ? (
          <ReportModal
            visible={reportModalVisible}
            spotId={spot.id}
            initialLocation={`${spot.nombre}, ${spot.provincia}`}
            onClose={() => setReportModalVisible(false)}
            onSuccess={onToast}
          />
        ) : null}
      </>
    );
  },
);

SpotSheet.displayName = 'SpotSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
  },
  handle: {
    backgroundColor: theme.colors.muted,
  },
  content: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.md,
  },
  titleBlock: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.textMain,
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    fontWeight: '700',
  },
  province: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  recent: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: '800',
  },
  button: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.background,
    fontWeight: '800',
  },
});
