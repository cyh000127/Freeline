import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme/colors';
import { AppImage } from './AppImage';

type Props = {
  title: string;
  dateLabel: string;
  dayLabel: string;
  venueLabel: string;
  imageSource?: string | number | null;
};

export function HeroEventCard({
  title,
  dateLabel,
  dayLabel,
  venueLabel,
  imageSource,
}: Props) {
  return (
    <View style={styles.card}>
      <AppImage
        fallback={
          <View style={styles.imageFallback}>
            <Text style={styles.fallbackVenue}>{venueLabel}</Text>
            <Text style={styles.fallbackTitle}>{title}</Text>
          </View>
        }
        source={imageSource}
        style={styles.media}
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{venueLabel}</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{dateLabel}</Text>
          <Text style={styles.day}>{dayLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 182,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  media: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  imageFallback: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: palette.ink,
    gap: 8,
  },
  fallbackVenue: {
    color: palette.limeSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
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
