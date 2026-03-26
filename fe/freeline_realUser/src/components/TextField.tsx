import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { palette } from '@/theme/colors';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
};

export function TextField({ label, hint, style, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={palette.textMuted}
        style={[styles.input, style]}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
  },
  input: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingHorizontal: 18,
    fontSize: 16,
    color: palette.text,
  },
  hint: {
    fontSize: 12,
    color: palette.textMuted,
  },
});
