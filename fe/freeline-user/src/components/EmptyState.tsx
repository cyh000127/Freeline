import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { palette } from '@/theme/colors';

type Props = {
  title: string;
  caption: string;
};

export function EmptyState({ title, caption }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Feather color={palette.ink} name="inbox" size={22} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: palette.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  caption: {
    textAlign: 'center',
    color: palette.textMuted,
    lineHeight: 20,
  },
});
