import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { theme } from '@/constants/theme';
import type { Spot } from '@/types';

const DEFAULT_CENTER = { lat: -34.6, lng: -58.45 };
const DEFAULT_ZOOM = 9;
const GOOGLE_MAPS_WEB_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY ?? '';

const mapContainerStyle = {
  height: '100%',
  width: '100%',
};

const mapOptions = {
  clickableIcons: false,
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
};

function isValidCoordinate(spot: Spot) {
  return (
    Number.isFinite(spot.lat) &&
    Number.isFinite(spot.lon) &&
    spot.lat >= -90 &&
    spot.lat <= 90 &&
    spot.lon >= -180 &&
    spot.lon <= 180
  );
}

export function SpotMap({
  spots,
  onSpotPress,
  onMapPress,
}: {
  spots: Spot[];
  onSpotPress: (spot: Spot) => void;
  onMapPress: () => void;
}) {
  if (!GOOGLE_MAPS_WEB_API_KEY) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>Falta configurar EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY.</Text>
      </View>
    );
  }

  return (
    <LoadedSpotMap
      apiKey={GOOGLE_MAPS_WEB_API_KEY}
      onMapPress={onMapPress}
      onSpotPress={onSpotPress}
      spots={spots}
    />
  );
}

function LoadedSpotMap({
  apiKey,
  spots,
  onSpotPress,
  onMapPress,
}: {
  apiKey: string;
  spots: Spot[];
  onSpotPress: (spot: Spot) => void;
  onMapPress: () => void;
}) {
  const visibleSpots = useMemo(() => spots.filter(isValidCoordinate), [spots]);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'lineapp-google-maps-web',
  });

  if (loadError) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>No pudimos cargar Google Maps.</Text>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GoogleMap
        center={DEFAULT_CENTER}
        mapContainerStyle={mapContainerStyle}
        onClick={onMapPress}
        options={mapOptions}
        zoom={DEFAULT_ZOOM}
      >
        {visibleSpots.map((spot) => (
          <MarkerF
            key={spot.id}
            onClick={() => onSpotPress(spot)}
            position={{ lat: spot.lat, lng: spot.lon }}
            title={spot.nombre}
          />
        ))}
      </GoogleMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  state: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  stateText: {
    color: theme.colors.textSecondary,
    fontWeight: '800',
    textAlign: 'center',
  },
});
