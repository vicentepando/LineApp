import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type LatLng } from 'react-native-maps';
import { SpotPin } from '@/components/map/SpotPin';
import type { Spot } from '@/types';

const DEFAULT_REGION = {
  latitude: -40.0,
  longitude: -71.0,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

const SINGLE_SPOT_DELTA = 0.08;
const EDGE_PADDING = {
  top: 150,
  right: 72,
  bottom: 180,
  left: 72,
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
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const visibleSpots = useMemo(() => spots.filter(isValidCoordinate), [spots]);
  const coordinates = useMemo<LatLng[]>(
    () => visibleSpots.map((spot) => ({ latitude: spot.lat, longitude: spot.lon })),
    [visibleSpots],
  );
  const coordinateKey = useMemo(
    () => visibleSpots.map((spot) => `${spot.id}:${spot.lat}:${spot.lon}`).join('|'),
    [visibleSpots],
  );

  useEffect(() => {
    if (!mapReady || coordinates.length === 0) return;

    requestAnimationFrame(() => {
      if (coordinates.length === 1) {
        const [coordinate] = coordinates;
        mapRef.current?.animateToRegion(
          {
            ...coordinate,
            latitudeDelta: SINGLE_SPOT_DELTA,
            longitudeDelta: SINGLE_SPOT_DELTA,
          },
          250,
        );
        return;
      }

      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: EDGE_PADDING,
        animated: true,
      });
    });
  }, [coordinateKey, coordinates, mapReady]);

  return (
    <MapView
      ref={mapRef}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      style={styles.map}
      initialRegion={DEFAULT_REGION}
      onMapReady={() => setMapReady(true)}
      onPress={onMapPress}
    >
      {visibleSpots.map((spot) => (
        <SpotPin key={spot.id} spot={spot} onPress={onSpotPress} />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
});
