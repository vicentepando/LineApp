import { Marker } from 'react-native-maps';
import { theme } from '@/constants/theme';
import type { Spot } from '@/types';

export function SpotPin({ spot, onPress }: { spot: Spot; onPress: (spot: Spot) => void }) {
  return (
    <Marker
      coordinate={{ latitude: spot.lat, longitude: spot.lon }}
      pinColor={theme.colors.pinColor}
      title={spot.nombre}
      description={spot.provincia}
      onPress={() => onPress(spot)}
    />
  );
}
