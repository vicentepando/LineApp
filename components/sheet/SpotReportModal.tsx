import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { theme } from '@/constants/theme';
import { SPOTS_QUERY_KEY } from '@/hooks/useSpots';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Spot, TipoLinea } from '@/types';

const lineTypes: TipoLinea[] = ['flote', 'hundimiento', 'sink-tip'];

const makeSpotName = (name: string, description: string) => {
  const cleanName = name.trim();
  if (cleanName) return cleanName;
  const firstLine = description.trim().split('\n')[0]?.trim();
  if (firstLine) return firstLine.slice(0, 42);
  return `Spot reportado ${new Date().toLocaleDateString('es-AR')}`;
};

export default function SpotReportModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [zone, setZone] = useState('');
  const [description, setDescription] = useState('');
  const [fly, setFly] = useState('');
  const [lineWeight, setLineWeight] = useState('5');
  const [lineType, setLineType] = useState<TipoLinea>('flote');
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setZone('');
    setDescription('');
    setFly('');
    setLineWeight('5');
    setLineType('flote');
    setLocation(null);
    setPhotoUri(null);
    setError(null);
  };

  const close = () => {
    if (!sending) onClose();
  };

  const captureLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError('Necesitamos permiso de ubicación para cargar el spot.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: current.coords.latitude,
        lon: current.coords.longitude,
      });
    } catch (locationError) {
      setError(locationError instanceof Error ? locationError.message : 'No pudimos obtener la ubicación.');
    } finally {
      setLocating(false);
    }
  };

  const pickPhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
    });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri ?? null);
  };

  const uploadPhoto = async () => {
    if (!photoUri || !user) return null;
    const response = await fetch(photoUri);
    const arrayBuffer = await response.arrayBuffer();
    const path = `${user.id}/spot-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('reportes-fotos')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('reportes-fotos').getPublicUrl(path);
    return data.publicUrl;
  };

  const submit = async () => {
    if (!user) {
      setError('Iniciá sesión para cargar spots y sumar puntos.');
      return;
    }
    if (!hasSupabaseConfig) {
      setError('Faltan las variables de Supabase en .env');
      return;
    }
    if (!location) {
      setError('Cargá la ubicación del spot.');
      return;
    }
    if (!description.trim() || !fly.trim()) {
      setError('Completá descripción y mosca usada.');
      return;
    }
    const parsedLineWeight = Number.parseInt(lineWeight, 10);
    if (!Number.isInteger(parsedLineWeight) || parsedLineWeight < 1 || parsedLineWeight > 12) {
      setError('La línea tiene que ser un número entre 1 y 12.');
      return;
    }

    setSending(true);
    setError(null);
    try {
      const fotoUrl = await uploadPhoto();
      const points = fotoUrl ? 400 : 200;
      const spotName = makeSpotName(name, description);
      const spotProvince = zone.trim() || 'Reportado';
      const { data: spotId, error: rpcError } = await supabase.rpc('submit_spot_report', {
        p_nombre: spotName,
        p_provincia: spotProvince,
        p_lat: location.lat,
        p_lon: location.lon,
        p_descripcion: description.trim(),
        p_mosca: fly.trim(),
        p_linea_weight: parsedLineWeight,
        p_linea_tipo: lineType,
        p_foto_url: fotoUrl,
      });
      if (rpcError) throw rpcError;

      if (spotId) {
        const newSpot: Spot = {
          id: spotId,
          nombre: spotName,
          provincia: spotProvince,
          tipo: 'río',
          lat: location.lat,
          lon: location.lon,
          accesibilidad: 'público',
          especies: [],
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<Spot[]>(SPOTS_QUERY_KEY, (currentSpots = []) => {
          if (currentSpots.some((spot) => spot.id === newSpot.id)) return currentSpots;
          return [...currentSpots, newSpot].sort((a, b) => a.nombre.localeCompare(b.nombre));
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SPOTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['usuario', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['mis-reportes-validados', user.id] }),
      ]);
      reset();
      onClose();
      onSuccess(`Spot cargado. +${points} puntos`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos cargar el spot.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modal,
            {
              marginBottom: Math.max(insets.bottom + theme.spacing.sm, theme.spacing.sm),
              marginTop: Math.max(insets.top + theme.spacing.lg, theme.spacing.lg),
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Cargar spot/reporte</Text>
            <Pressable onPress={close}>
              <Text style={styles.close}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom + theme.spacing.md, theme.spacing.lg) },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nombre o referencia del spot"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />
            <TextInput
              value={zone}
              onChangeText={setZone}
              placeholder="Provincia o zona"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />

            <Pressable style={styles.secondaryButton} onPress={captureLocation} disabled={locating}>
              {locating ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <Text style={styles.secondaryButtonText}>
                  {location ? `Ubicación cargada (${location.lat.toFixed(4)}, ${location.lon.toFixed(4)})` : 'Usar mi ubicación'}
                </Text>
              )}
            </Pressable>

            <TextInput
              value={description}
              onChangeText={(value) => setDescription(value.slice(0, 280))}
              placeholder="Descripción del spot, acceso, agua, condiciones..."
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.input, styles.textArea]}
              multiline
              maxLength={280}
            />

            <TextInput
              value={fly}
              onChangeText={setFly}
              placeholder="¿Qué mosca se usó?"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />

            <View style={styles.lineRow}>
              <TextInput
                value={lineWeight}
                onChangeText={setLineWeight}
                keyboardType="number-pad"
                placeholder="Línea #"
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.input, styles.lineWeight]}
              />
              <View style={styles.typeGroup}>
                {lineTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.typeButton, lineType === type && styles.typeButtonActive]}
                    onPress={() => setLineType(type)}
                  >
                    <Text style={[styles.typeText, lineType === type && styles.typeTextActive]}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable style={styles.secondaryButton} onPress={pickPhoto}>
              <Text style={styles.secondaryButtonText}>{photoUri ? 'Foto seleccionada (+400 puntos)' : 'Agregar foto (+400 puntos)'}</Text>
            </Pressable>

            <Text style={styles.pointsHint}>Sin foto suma 200 puntos. Con foto suma 400 puntos.</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={styles.primaryButton} onPress={submit} disabled={sending}>
              {sending ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.primaryButtonText}>Cargar spot</Text>}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: theme.colors.textMain,
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.sm,
    maxHeight: '88%',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  content: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.textMain,
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    fontWeight: '700',
  },
  close: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  input: {
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    color: theme.colors.textMain,
    padding: theme.spacing.md,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  lineRow: {
    gap: theme.spacing.sm,
  },
  lineWeight: {
    maxWidth: 112,
  },
  typeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  typeButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeText: {
    color: theme.colors.textSecondary,
    fontWeight: '800',
  },
  typeTextActive: {
    color: theme.colors.background,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  pointsHint: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  error: {
    color: theme.colors.danger,
  },
});
