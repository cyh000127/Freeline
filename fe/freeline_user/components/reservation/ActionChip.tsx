import { Pressable, StyleSheet, Text } from 'react-native';

type ActionChipProps = {
  label: string;
  tone?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  onPress?: () => void;
};

export default function ActionChip({ label, tone = 'blue', onPress }: ActionChipProps) {
  return (
    <Pressable style={[styles.base, toneStyles[tone]]} onPress={onPress}>
      <Text style={[styles.text, textToneStyles[tone]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});

const toneStyles = StyleSheet.create({
  blue: { backgroundColor: '#D9F1FF' },
  green: { backgroundColor: '#DDF5E6' },
  yellow: { backgroundColor: '#FFF0B8' },
  red: { backgroundColor: '#FFD9D9' },
  gray: { backgroundColor: '#E8E8EE' },
});

const textToneStyles = StyleSheet.create({
  blue: { color: '#2196C9' },
  green: { color: '#2F9B5A' },
  yellow: { color: '#B88400' },
  red: { color: '#D95454' },
  gray: { color: '#6C6C79' },
});
