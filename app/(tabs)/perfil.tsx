import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SpotReportModal from '@/components/sheet/SpotReportModal';
import { theme } from '@/constants/theme';
import { useMisReportesValidados } from '@/hooks/useReportes';
import { useUsuario } from '@/hooks/useUsuario';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const clearGuest = useAuthStore((state) => state.clearGuest);
  const { data: usuario, isLoading } = useUsuario(user?.id);
  const { data: reportes = [] } = useMisReportesValidados(user?.id);
  const [spotModalVisible, setSpotModalVisible] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const logout = async () => {
    await supabase.auth.signOut();
    clearGuest();
    router.replace('/login');
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const openSpotModal = () => {
    setSpotModalVisible(true);
  };

  if (!user) {
    return (
      <View
        style={[
          styles.center,
          {
            paddingBottom: Math.max(insets.bottom + theme.spacing.lg, theme.spacing.xl),
            paddingTop: Math.max(insets.top + theme.spacing.lg, theme.spacing.xl),
          },
        ]}
      >
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.text}>Estás explorando sin cuenta. Creá una cuenta para ver fichas técnicas completas, sumar puntos y subir reportes.</Text>
        <Pressable style={styles.button} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Crear cuenta / Iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom + theme.spacing.lg, theme.spacing.xl),
          paddingTop: Math.max(insets.top + theme.spacing.xl, 64),
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{usuario?.nombre || user.email}</Text>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>Salir</Text>
        </Pressable>
      </View>

      <View style={styles.badge}>
        <Text style={styles.points}>{usuario?.puntos_totales ?? 0} puntos</Text>
        <Text style={styles.level}>Nivel {usuario?.nivel ?? 'principiante'} · {usuario?.aportes_validados ?? 0} aportes validados</Text>
      </View>

      <Pressable style={styles.spotButton} onPress={openSpotModal}>
        <Text style={styles.spotButtonText}>Cargar spot/reporte</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Historial de reportes</Text>
      <FlatList
        data={reportes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.text}>Todavía no tenés reportes.</Text>}
        renderItem={({ item }) => (
          <View style={styles.report}>
            <Text style={styles.reportTitle}>{item.spots?.nombre ?? 'Spot'} · {item.fecha}</Text>
            {item.local ? <Text style={styles.pending}>Reporte enviado</Text> : null}
            <Text style={styles.text}>{item.condiciones_texto || 'Sin comentario'}</Text>
            {item.mosca_funciono ? <Text style={styles.text}>Mosca: {item.mosca_funciono}</Text> : null}
          </View>
        )}
      />

      {toast ? <Text style={[styles.toast, { bottom: Math.max(insets.bottom + theme.spacing.lg, 32) }]}>{toast}</Text> : null}

      {spotModalVisible ? (
        <SpotReportModal
          visible={spotModalVisible}
          onClose={() => setSpotModalVisible(false)}
          onSuccess={showToast}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
    paddingHorizontal: 28,
  },
  center: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    gap: theme.spacing.md,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.textMain,
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    fontWeight: '700',
  },
  logout: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  points: {
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  level: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  sectionTitle: {
    color: theme.colors.textMain,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: theme.spacing.md,
  },
  spotButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  spotButtonText: {
    color: theme.colors.background,
    fontWeight: '800',
  },
  list: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  report: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  reportTitle: {
    color: theme.colors.textMain,
    fontWeight: '800',
  },
  pending: {
    color: theme.colors.success,
    fontWeight: '800',
  },
  text: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.background,
    fontWeight: '800',
  },
  toast: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    bottom: 32,
    color: theme.colors.background,
    fontWeight: '800',
    left: theme.spacing.lg,
    padding: theme.spacing.md,
    position: 'absolute',
    right: theme.spacing.lg,
    textAlign: 'center',
  },
});
