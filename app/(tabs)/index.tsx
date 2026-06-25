import BottomSheet from '@gorhom/bottom-sheet';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapSearch } from '@/components/map/MapSearch';
import { SpotMap } from '@/components/map/SpotMap';
import { SpotSheet } from '@/components/sheet/SpotSheet';
import { theme } from '@/constants/theme';
import { useSpots } from '@/hooks/useSpots';
import type { Spot } from '@/types';

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const { data: spots = [], isLoading, error, refetch } = useSpots();
  const [query, setQuery] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filteredSpots = useMemo(() => {
    const normalized = normalizeSearchText(query);
    if (!normalized) return spots;
    return spots.filter((spot) =>
      normalizeSearchText(`${spot.nombre} ${spot.provincia}`).includes(normalized),
    );
  }, [query, spots]);

  const openSpot = (spot: Spot) => {
    setSelectedSpot(spot);
    requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
  };

  const closeSheet = () => sheetRef.current?.close();

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <View style={styles.container}>
      <SpotMap spots={filteredSpots} onSpotPress={openSpot} onMapPress={closeSheet} />

      <MapSearch value={query} onChangeText={setQuery} />

      {isLoading ? (
        <View style={[styles.state, { top: Math.max(insets.top + 92, 124) }]}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text style={styles.stateText}>Cargando spots...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.errorBox, { top: Math.max(insets.top + 92, 124) }]}>
          <Text style={styles.errorText}>{error instanceof Error ? error.message : 'No pudimos cargar spots'}</Text>
          <Pressable onPress={() => refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {toast ? <Text style={[styles.toast, { bottom: Math.max(insets.bottom + 80, 96) }]}>{toast}</Text> : null}

      <SpotSheet ref={sheetRef} spot={selectedSpot} onToast={showToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  state: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    left: theme.spacing.lg,
    padding: theme.spacing.md,
    position: 'absolute',
    right: theme.spacing.lg,
  },
  stateText: {
    color: theme.colors.textSecondary,
  },
  errorBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    left: theme.spacing.lg,
    padding: theme.spacing.md,
    position: 'absolute',
    right: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
  },
  retry: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  retryText: {
    color: theme.colors.background,
    fontWeight: '800',
  },
  toast: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    bottom: 96,
    color: theme.colors.background,
    fontWeight: '800',
    left: theme.spacing.lg,
    padding: theme.spacing.md,
    position: 'absolute',
    right: theme.spacing.lg,
    textAlign: 'center',
  },
});
