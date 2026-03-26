import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme/colors';

type Props = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: Props) {
  return (
    <View style={[styles.row, compact ? styles.compactRow : null]}>
      <View style={styles.logo}>
        <View style={styles.vertical} />
        <View style={styles.horizontal} />
        <View style={styles.dot} />
      </View>
      <Text style={[styles.wordmark, compact ? styles.compactWordmark : null]}>줄서잇</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  compactRow: {
    gap: 10,
  },
  logo: {
    width: 28,
    height: 40,
    position: 'relative',
  },
  vertical: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 9,
    height: 40,
    backgroundColor: palette.ink,
  },
  horizontal: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 28,
    height: 9,
    backgroundColor: palette.ink,
  },
  dot: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: palette.lime,
  },
  wordmark: {
    fontSize: 40,
    fontWeight: '800',
    color: palette.ink,
  },
  compactWordmark: {
    fontSize: 24,
  },
});
