import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { theme } from '@/constants/theme';
import { saveLocalReporte, type LocalReporte } from '@/lib/localReportes';
import { useAuthStore } from '@/stores/authStore';
import type { TipoLinea } from '@/types';

const lineTypes: TipoLinea[] = ['flote', 'hundimiento', 'sink-tip'];
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formatTime = (date: Date) => date.toTimeString().slice(0, 8);

const makeSpotName = (name: string, locationText: string, description: string) => {
  const cleanName = name.trim();
  if (cleanName) return cleanName;
  const cleanLocation = locationText.trim();
  if (cleanLocation) return cleanLocation.slice(0, 42);
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
  const [locationText, setLocationText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setZone('');
    setDescription('');
    setFly('');
    setLineWeight('5');
    setLineType('flote');
    setLocationText('');
    setPhotoUri(null);
    setError(null);
  };

  const close = () => {
    if (!sending) onClose();
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

  const submit = async () => {
    if (!user) {
      setError('Iniciá sesión para cargar reportes.');
      return;
    }
    if (!locationText.trim()) {
      setError('Agregá una ubicación.');
      return;
    }
    if (!description.trim() || !fly.trim()) {
      setError('Completá descripción y señuelo usado.');
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
      const now = new Date();
      const reportId = `local-spot-${Date.now()}`;
      const points = photoUri ? 400 : 200;
      const spotName = makeSpotName(name, locationText, description);
      const spotProvince = zone.trim() || 'Reportado';
      const reportPayload: LocalReporte = {
        id: reportId,
        spot_id: reportId,
        user_id: user.id,
        fecha: formatDate(now),
        hora: formatTime(now),
        condiciones_texto: description.trim(),
        hubo_pique: true,
        mosca_funciono: fly.trim(),
        linea: `#${parsedLineWeight} ${lineType}`,
        tippet: null,
        cania: null,
        trucha: null,
        ubicacion: locationText.trim(),
        puntaje_estrellas: null,
        foto_url: photoUri,
        validado: false,
        puntos_asignados: points,
        created_at: now.toISOString(),
        local: true,
        spots: {
          nombre: spotName,
          provincia: spotProvince,
        },
      };
      await saveLocalReporte(reportPayload);
      queryClient.setQueryData<LocalReporte[]>(['mis-reportes-validados', user.id], (current = []) => [reportPayload, ...current]);
      queryClient.setQueryData(['usuario', user.id], (current: unknown) => {
        if (!current || typeof current !== 'object') return current;
        const usuario = current as { puntos_totales?: number; aportes_validados?: number };
        return {
          ...usuario,
          puntos_totales: (usuario.puntos_totales ?? 0) + points,
          aportes_validados: (usuario.aportes_validados ?? 0) + 1,
        };
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mis-reportes-validados', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['usuario', user.id] }),
      ]);
      reset();
      onClose();
      onSuccess(`Reporte cargado. +${points} puntos`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No pudimos guardar el reporte.');
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
            <Text style={styles.title}>Cargar reporte</Text>
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

            <TextInput
              value={locationText}
              onChangeText={setLocationText}
              placeholder="Ubicación"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />

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
              placeholder="¿Qué señuelo se usó?"
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
              <Text style={styles.secondaryButtonText}>{photoUri ? 'Foto seleccionada' : 'Agregar foto'}</Text>
            </Pressable>

            <Text style={styles.pointsHint}>Sin foto suma 200 puntos. Con foto suma 400 puntos.</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={styles.primaryButton} onPress={submit} disabled={sending}>
              {sending ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.primaryButtonText}>Cargar reporte</Text>}
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
