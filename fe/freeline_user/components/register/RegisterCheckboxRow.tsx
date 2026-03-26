import { Checkbox } from 'expo-checkbox';
import { Pressable, StyleSheet, Text } from 'react-native';

type RegisterCheckboxRowProps = {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
};

export default function RegisterCheckboxRow({
  value,
  onChange,
  label,
}: RegisterCheckboxRowProps) {
  return (
    <Pressable style={styles.row} onPress={() => onChange(!value)}>
      <Checkbox
        value={value}
        onValueChange={onChange}
        color={value ? '#302C55' : undefined}
        style={styles.checkbox}
      />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 8,
  },
  label: {
    flex: 1,
    fontFamily: 'Pretendard',
    fontSize: 13,
    lineHeight: 18,
    color: '#222222',
  },
});
