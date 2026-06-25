import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { theme } from '@/constants/theme';
import { saveLocalReporte, type LocalReporte } from '@/lib/localReportes';
import { useAuthStore } from '@/stores/authStore';

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const formatTime = (date: Date) => date.toTimeString().slice(0, 8);
const clampToNow = (date: Date) => {
  const now = new Date();
  return date.getTime() > now.getTime() ? now : date;
};

const getSpotLabel = (initialLocation?: string) => {
  const [nombre, provincia] = (initialLocation ?? 'Spot').split(',').map((part) => part.trim());
  return {
    nombre: nombre || 'Spot',
    provincia: provincia || '',
  };
};

export function ReportModal({
  visible,
  spotId,
  initialLocation,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  spotId: string;
  initialLocation?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<false | 'date' | 'time'>(false);
  const [condiciones, setCondiciones] = useState('');
  const [huboPique, setHuboPique] = useState(false);
  const [mosca, setMosca] = useState('');
  const [linea, setLinea] = useState('');
  const [tippet, setTippet] = useState('');
  const [cania, setCania] = useState('');
  const [trucha, setTrucha] = useState('');
  const [ubicacion, setUbicacion] = useState(initialLocation ?? '');
  const [rating, setRating] = useState(0);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setUbicacion(initialLocation ?? '');
  }, [initialLocation, visible]);

  const logSupabaseError = (context: string, supabaseError: unknown) => {
    const maybeError = supabaseError as { message?: string; code?: string; details?: string; hint?: string };
    console.warn(context, {
      message: maybeError?.message,
      code: maybeError?.code,
      details: maybeError?.details,
      hint: maybeError?.hint,
      error: supabaseError,
    });
  };

  const pickPhoto = async () => {
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
      setError('Iniciá sesión o creá una cuenta para subir reportes.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      if (rating < 1 || rating > 5) {
        setError('Puntuá el spot con estrellas del 1 al 5.');
        return;
      }
      if (!mosca.trim() || !linea.trim() || !tippet.trim() || !cania.trim() || !trucha.trim() || !ubicacion.trim() || !condiciones.trim()) {
        setError('Completá mosca, línea, tippet, caña, trucha, ubicación y descripción.');
        return;
      }
      const reportDate = clampToNow(date);
      if (date.getTime() > reportDate.getTime()) {
        setDate(reportDate);
        setError('La fecha del reporte no puede ser posterior al momento actual.');
        return;
      }
      const spotLabel = getSpotLabel(initialLocation);
      const reportPayload: LocalReporte = {
        id: `local-${Date.now()}`,
        spot_id: spotId,
        user_id: user.id,
        fecha: formatDate(reportDate),
        hora: formatTime(reportDate),
        condiciones_texto: condiciones.trim(),
        hubo_pique: huboPique,
        mosca_funciono: mosca.trim(),
        linea: linea.trim(),
        tippet: tippet.trim(),
        cania: cania.trim(),
        trucha: trucha.trim(),
        ubicacion: ubicacion.trim(),
        puntaje_estrellas: rating,
        foto_url: photoUri,
        validado: false,
        puntos_asignados: 0,
        created_at: new Date().toISOString(),
        local: true,
        spots: spotLabel,
      };
      await saveLocalReporte(reportPayload);
      queryClient.setQueryData<LocalReporte[]>(['mis-reportes-validados', user.id], (current = []) => [reportPayload, ...current]);
      await queryClient.invalidateQueries({ queryKey: ['reportes', spotId] });
      await queryClient.invalidateQueries({ queryKey: ['mis-reportes-validados', user.id] });
      setCondiciones('');
      setHuboPique(false);
      setMosca('');
      setLinea('');
      setTippet('');
      setCania('');
      setTrucha('');
      setUbicacion(initialLocation ?? '');
      setRating(0);
      setPhotoUri(null);
      onClose();
      onSuccess('Reporte enviado');
    } catch (caughtError) {
      logSupabaseError('No pudimos enviar el reporte', caughtError);
      setError('No se pudo guardar el reporte en este dispositivo');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Subir reporte</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Cerrar</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.row}>
              <Pressable style={styles.dateButton} onPress={() => setShowPicker('date')}>
                <Text style={styles.dateText}>{formatDate(date)}</Text>
              </Pressable>
              <Pressable style={styles.dateButton} onPress={() => setShowPicker('time')}>
                <Text style={styles.dateText}>{formatTime(date).slice(0, 5)}</Text>
              </Pressable>
            </View>

            {showPicker && (
              <DateTimePicker
                value={date}
                mode={showPicker}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, selected) => {
                  if (Platform.OS !== 'ios') setShowPicker(false);
                  if (selected) {
                    const nextDate = clampToNow(selected);
                    setDate(nextDate);
                    if (selected.getTime() > nextDate.getTime()) {
                      setError('La fecha del reporte no puede ser posterior al momento actual.');
                    } else {
                      setError(null);
                    }
                  }
                }}
              />
            )}

            <View style={styles.ratingBlock}>
              <Text style={styles.label}>Puntuación del spot</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable key={value} onPress={() => setRating(value)} hitSlop={8}>
                    <Text style={[styles.star, value <= rating && styles.starActive]}>{value <= rating ? '★' : '☆'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextInput
              value={ubicacion}
              onChangeText={setUbicacion}
              placeholder="Ubicación"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />

            <TextInput
              value={condiciones}
              onChangeText={(value) => setCondiciones(value.slice(0, 280))}
              placeholder="Descripción: condiciones del agua, actividad, presión de pesca..."
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.input, styles.textArea]}
              multiline
              maxLength={280}
            />

            <View style={styles.toggleRow}>
              <Text style={styles.label}>¿Hubo pique?</Text>
              <Switch value={huboPique} onValueChange={setHuboPique} trackColor={{ true: theme.colors.primaryLight }} />
            </View>

            <TextInput
              value={mosca}
              onChangeText={setMosca}
              placeholder="Mosca usada"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />

            <TextInput
              value={linea}
              onChangeText={setLinea}
              placeholder="Línea usada"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />

            <TextInput
              value={tippet}
              onChangeText={setTippet}
              placeholder="Tippet usado"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />

            <TextInput
              value={cania}
              onChangeText={setCania}
              placeholder="Caña usada"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />

            <TextInput
              value={trucha}
              onChangeText={setTrucha}
              placeholder="Qué trucha salió"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />

            <Pressable style={styles.secondaryButton} onPress={pickPhoto}>
              <Text style={styles.secondaryButtonText}>{photoUri ? 'Foto seleccionada' : 'Agregar foto'}</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={styles.primaryButton} onPress={submit} disabled={sending}>
              {sending ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.primaryButtonText}>Enviar reporte</Text>}
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
    gap: theme.spacing.md,
    maxHeight: '88%',
    padding: theme.spacing.lg,
  },
  content: {
    gap: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  dateButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    flex: 1,
    padding: theme.spacing.md,
  },
  dateText: {
    color: theme.colors.textMain,
    fontWeight: '700',
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
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingBlock: {
    gap: theme.spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  star: {
    color: theme.colors.muted,
    fontSize: 28,
  },
  starActive: {
    color: theme.colors.warning,
  },
  label: {
    color: theme.colors.textMain,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
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
  error: {
    color: theme.colors.danger,
  },
});
