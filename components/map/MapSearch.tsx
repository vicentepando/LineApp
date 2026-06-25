import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

export function MapSearch({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { top: Math.max(insets.top + theme.spacing.lg, 56) }]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Buscar spot o provincia"
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    left: theme.spacing.lg,
    position: 'absolute',
    right: theme.spacing.lg,
    zIndex: 10,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    color: theme.colors.textMain,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    shadowColor: theme.colors.textMain,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
});
