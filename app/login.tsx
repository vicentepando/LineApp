import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '@/constants/theme';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { ExperienciaPesca, NivelUsuario } from '@/types';

type ScreenMode = 'entry' | 'login' | 'onboarding';
type OnboardingStep = 1 | 2 | 3;
type PescaChoice = 'si' | 'aprender';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const levels: NivelUsuario[] = ['principiante', 'intermedio', 'avanzado'];
const experiences: Array<{ value: ExperienciaPesca; label: string }> = [
  { value: '1-9_meses', label: '1-9 meses' },
  { value: '9-18_meses', label: '9-18 meses' },
  { value: 'mas_2_anos', label: 'Más de 2 años' },
];

const levelLabel: Record<NivelUsuario, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export default function LoginScreen() {
  const authMessage = useAuthStore((state) => state.authMessage);
  const setAuthMessage = useAuthStore((state) => state.setAuthMessage);
  const enterGuest = useAuthStore((state) => state.enterGuest);
  const clearGuest = useAuthStore((state) => state.clearGuest);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [mode, setMode] = useState<ScreenMode>('entry');
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(1);
  const [pescaChoice, setPescaChoice] = useState<PescaChoice | null>(null);
  const [nivel, setNivel] = useState<NivelUsuario | null>(null);
  const [experiencia, setExperiencia] = useState<ExperienciaPesca | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = () => setError(null);

  const startOnboarding = () => {
    setMode('onboarding');
    setOnboardingStep(1);
    resetError();
  };

  const backToEntry = () => {
    setMode('entry');
    setOnboardingStep(1);
    resetError();
  };

  const validateAccountFields = () => {
    if (!nombre.trim()) return 'Completá tu nombre.';
    if (!emailRegex.test(email.trim())) return 'Ingresá un email válido.';
    if (!password) return 'Ingresá una contraseña.';
    return null;
  };

  const submit = async () => {
    if (!hasSupabaseConfig) {
      setError('Pegá tus variables de Supabase en .env para iniciar sesión.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Ingresá un email válido.');
      return;
    }
    if (!password) {
      setError('Ingresá una contraseña.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      clearGuest();
      setAuthMessage(null);
      router.replace('/(tabs)');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'No pudimos autenticarte');
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async () => {
    const accountError = validateAccountFields();
    if (accountError) {
      setError(accountError);
      return;
    }
    if (!hasSupabaseConfig) {
      setError('Pegá tus variables de Supabase en .env para crear tu cuenta.');
      return;
    }

    const pescaConMosca = pescaChoice === 'si';
    const resolvedNivel = pescaChoice === 'aprender' ? 'principiante' : nivel;
    const resolvedExperiencia = pescaChoice === 'aprender' ? null : experiencia;
    if (!pescaChoice || !resolvedNivel || (pescaChoice === 'si' && !resolvedExperiencia)) {
      setError('Completá los pasos obligatorios del onboarding.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            pesca_con_mosca: pescaConMosca,
            nivel: resolvedNivel,
            experiencia_pesca: resolvedExperiencia,
          },
        },
      });
      if (signUpError) throw signUpError;
      if (data.user) {
        const { error: profileError } = await supabase.from('usuarios').upsert({
          id: data.user.id,
          nombre: nombre.trim(),
          email: email.trim(),
          pesca_con_mosca: pescaConMosca,
          nivel: resolvedNivel,
          experiencia_pesca: resolvedExperiencia,
        });
        if (profileError) throw profileError;
      }
      clearGuest();
      setAuthMessage(null);
      router.replace('/(tabs)');
    } catch (authError) {
      setError(getErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  const continueGuest = () => {
    setAuthMessage(null);
    enterGuest();
    router.replace('/(tabs)');
  };

  const continueOnboarding = () => {
    setError(null);
    if (onboardingStep === 1) {
      if (!pescaChoice) {
        setError('Elegí una opción para continuar.');
        return;
      }
      if (pescaChoice === 'aprender') {
        setNivel('principiante');
        setExperiencia(null);
        setOnboardingStep(3);
      } else {
        setOnboardingStep(2);
      }
      return;
    }
    if (onboardingStep === 2) {
      if (!nivel || !experiencia) {
        setError('Elegí tu nivel y hace cuánto pescás.');
        return;
      }
      setOnboardingStep(3);
    }
  };

  const renderOption = ({
    optionKey,
    selected,
    title,
    subtitle,
    onPress,
  }: {
    optionKey?: string;
    selected: boolean;
    title: string;
    subtitle?: string;
    onPress: () => void;
  }) => (
    <Pressable key={optionKey} style={[styles.option, selected && styles.optionSelected]} onPress={onPress}>
      <View style={[styles.radio, selected && styles.radioSelected]} />
      <View style={styles.optionTextBlock}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{title}</Text>
        {subtitle ? <Text style={[styles.optionSubtitle, selected && styles.optionSubtitleSelected]}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );

  const renderEntry = () => (
    <>
      <Text style={styles.brand}>LineApp</Text>
      <Text style={styles.subtitle}>Spots, clima y reportes para pescar con mosca en Argentina.</Text>
      {authMessage ? <Text style={styles.notice}>{authMessage}</Text> : null}
      <Pressable style={styles.primaryButton} onPress={startOnboarding}>
        <Text style={styles.primaryButtonText}>Crear cuenta gratis</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={continueGuest}>
        <Text style={styles.secondaryButtonText}>Explorar sin cuenta</Text>
      </Pressable>
      <Pressable onPress={() => setMode('login')}>
        <Text style={styles.link}>Ya tengo cuenta</Text>
      </Pressable>
      <Text style={styles.guest}>Sin cuenta: mapa y spots básicos.</Text>
    </>
  );

  const renderLogin = () => (
    <>
      <Text style={styles.brand}>LineApp</Text>
      <Text style={styles.subtitle}>Ingresá para ver fichas técnicas completas y aportar reportes.</Text>
      {authMessage ? <Text style={styles.notice}>{authMessage}</Text> : null}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.primaryButton} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
      </Pressable>
      <Pressable onPress={startOnboarding}>
        <Text style={styles.link}>Crear cuenta gratis</Text>
      </Pressable>
      <Pressable onPress={backToEntry}>
        <Text style={styles.guest}>Volver</Text>
      </Pressable>
    </>
  );

  const renderOnboarding = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.stepLabel}>Paso {onboardingStep} de 3</Text>
        <Pressable onPress={backToEntry}>
          <Text style={styles.link}>Cancelar</Text>
        </Pressable>
      </View>
      {onboardingStep === 1 ? (
        <>
          <Text style={styles.title}>¿Pescás con mosca?</Text>
          <Text style={styles.subtitle}>Vamos a personalizar tu experiencia.</Text>
          {renderOption({
            selected: pescaChoice === 'si',
            title: 'Sí, pesco con mosca',
            subtitle: 'Ya tengo experiencia',
            onPress: () => setPescaChoice('si'),
          })}
          {renderOption({
            selected: pescaChoice === 'aprender',
            title: 'Quiero aprender',
            subtitle: 'Soy nuevo en la pesca con mosca',
            onPress: () => setPescaChoice('aprender'),
          })}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={continueOnboarding}>
            <Text style={styles.primaryButtonText}>Continuar</Text>
          </Pressable>
        </>
      ) : null}

      {onboardingStep === 2 ? (
        <>
          <Text style={styles.title}>Tu nivel</Text>
          {levels.map((level) =>
            renderOption({
              optionKey: level,
              selected: nivel === level,
              title: levelLabel[level],
              onPress: () => setNivel(level),
            }),
          )}
          <Text style={styles.titleSmall}>¿Hace cuánto pescás?</Text>
          {experiences.map((item) =>
            renderOption({
              optionKey: item.value,
              selected: experiencia === item.value,
              title: item.label,
              onPress: () => setExperiencia(item.value),
            }),
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={continueOnboarding}>
            <Text style={styles.primaryButtonText}>Continuar</Text>
          </Pressable>
        </>
      ) : null}

      {onboardingStep === 3 ? (
        <>
          <Text style={styles.title}>Crear cuenta</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.primaryButton} onPress={submitRegistration} disabled={loading}>
            {loading ? <ActivityIndicator color={theme.colors.background} /> : <Text style={styles.primaryButtonText}>Crear mi cuenta</Text>}
          </Pressable>
          <Pressable onPress={() => setOnboardingStep(pescaChoice === 'si' ? 2 : 1)}>
            <Text style={styles.guest}>Volver</Text>
          </Pressable>
        </>
      ) : null}
    </>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {mode === 'entry' ? renderEntry() : null}
          {mode === 'login' ? renderLogin() : null}
          {mode === 'onboarding' ? renderOnboarding() : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  brand: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.heading,
    fontSize: 34,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  title: {
    color: theme.colors.textMain,
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    fontWeight: '700',
  },
  titleSmall: {
    color: theme.colors.textMain,
    fontSize: 16,
    fontWeight: '800',
    marginTop: theme.spacing.sm,
  },
  stepHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    color: theme.colors.textSecondary,
    fontWeight: '800',
  },
  notice: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.primary,
    fontWeight: '800',
    padding: theme.spacing.md,
  },
  input: {
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    color: theme.colors.textMain,
    padding: theme.spacing.md,
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
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: '800',
  },
  option: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  optionSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primaryLight,
  },
  radio: {
    borderColor: theme.colors.muted,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    height: 22,
    width: 22,
  },
  radioSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionTextBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  optionTitle: {
    color: theme.colors.textMain,
    fontSize: 16,
    fontWeight: '800',
  },
  optionTitleSelected: {
    color: theme.colors.primary,
  },
  optionSubtitle: {
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  optionSubtitleSelected: {
    color: theme.colors.primary,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '800',
    textAlign: 'center',
  },
  guest: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    color: theme.colors.danger,
  },
});
