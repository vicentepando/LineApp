import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { theme } from '@/constants/theme';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      if (mounted) setOffline(!state.isConnected || state.isInternetReachable === false);
    };
    check();
    const id = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!offline) return null;
  return <Text style={styles.banner}>Sin conexión · usando datos guardados</Text>;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.accessPaidBg,
    color: theme.colors.accessPaidText,
    fontSize: 12,
    fontWeight: '800',
    padding: theme.spacing.sm,
    textAlign: 'center',
  },
});
