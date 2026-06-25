import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { useFicha } from '@/hooks/useFicha';
import { useAuthStore } from '@/stores/authStore';

export function FichaTecnicaBlock({ spotId }: { spotId: string }) {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, error } = useFicha(user ? spotId : undefined);

  if (!user) {
    return (
      <View style={styles.loginBox}>
        <Text style={styles.title}>Ficha técnica</Text>
        <Text style={styles.loginText}>Iniciá sesión para ver la ficha técnica completa.</Text>
        <View style={styles.lockedList}>
          <Text style={styles.lockedItem}>Mosca recomendada</Text>
          <Text style={styles.lockedItem}>Línea, tippet y caña</Text>
          <Text style={styles.lockedItem}>Horario ideal y reportes completos</Text>
        </View>
        <Pressable style={styles.loginButton} onPress={() => router.push('/login')}>
          <Text style={styles.loginButtonText}>Crear cuenta / Iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) return <ActivityIndicator color={theme.colors.primary} />;
  if (error) return <Text style={styles.empty}>No pudimos cargar la ficha técnica.</Text>;
  if (!data) return <Text style={styles.empty}>Sin ficha disponible</Text>;

  const truchas = data.truchas?.length ? data.truchas.join(', ') : 'Sin dato';

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Ficha técnica</Text>
      <Text style={styles.line}>Caña: #{data.cana_weight}, {data.cana_largo}ft, {data.cana_accion}</Text>
      <Text style={styles.line}>Línea: WF{data.linea_weight} {data.linea_tipo}</Text>
      <Text style={styles.line}>Leader/Tippet: {data.leader_largo}ft + {data.tippet_grosor}</Text>
      <Text style={styles.line}>Trucha: {truchas}</Text>
      <View style={styles.chips}>
        {data.moscas.slice(0, 3).map((mosca) => (
          <View key={`${mosca.nombre}-${mosca.tipo}`} style={styles.chip}>
            <Text style={styles.chipText}>{mosca.nombre} · {mosca.tipo}</Text>
          </View>
        ))}
      </View>
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
  line: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  empty: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  loginBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  loginText: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  lockedList: {
    gap: theme.spacing.xs,
  },
  lockedItem: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  loginButtonText: {
    color: theme.colors.background,
    fontWeight: '800',
  },
});
