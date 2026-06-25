import { StyleSheet, TextInput, View } from 'react-native';
import { theme } from '@/constants/theme';

export function MapSearch({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.container}>
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
    left: theme.spacing.md,
    position: 'absolute',
    right: theme.spacing.md,
    top: 56,
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
