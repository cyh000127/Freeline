import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme/colors';

type Props = {
  title: string;
  caption?: string;
};

export function SectionTitle({ title, caption }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.marker} />
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  marker: {
    width: 4,
    height: 22,
    borderRadius: 99,
    backgroundColor: palette.lime,
  },
  texts: {
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  caption: {
    fontSize: 12,
    color: palette.textMuted,
  },
});
