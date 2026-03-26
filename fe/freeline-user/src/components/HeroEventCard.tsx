import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme/colors';

type Props = {
  title: string;
  dateLabel: string;
  dayLabel: string;
  venueLabel: string;
  imageSource: number;
};

export function HeroEventCard({
  title,
  dateLabel,
  dayLabel,
  venueLabel,
  imageSource,
}: Props) {
  return (
    <ImageBackground imageStyle={styles.imageStyle} source={imageSource} style={styles.card}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{venueLabel}</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{dateLabel}</Text>
          <Text style={styles.day}>{dayLabel}</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 182,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 28,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 23, 50, 0.38)',
  },
  content: {
    padding: 20,
    gap: 8,
  },
  eyebrow: {
    color: palette.limeSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  day: {
    color: palette.lime,
    fontSize: 13,
    fontWeight: '800',
  },
});
