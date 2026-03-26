import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EventDetail } from '@/features/event/types';

type Props = {
  eventDetail: EventDetail | null;
  loading: boolean;
};

function getEventDayCount(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return '-';
  const today = new Date();
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  today.setHours(0,0,0,0);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  if (today < start) return '행사 전';
  if (today > end) return '행사 종료';
  
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  return `${diffDays + 1}일차`;
}

export default function HomeBanner({ eventDetail, loading }: Props) {
  const title = loading ? '불러오는 중...' : eventDetail?.name ?? '행사 정보 없음';
  const dateStr = loading 
    ? '불러오는 중...' 
    : eventDetail 
      ? `${eventDetail.startDate.replace(/-/g, '.')} - ${eventDetail.endDate.replace(/-/g, '.')}` 
      : '-';

  const dayCount = eventDetail 
    ? getEventDayCount(eventDetail.startDate, eventDetail.endDate) 
    : '-';

  const bannerSource = eventDetail?.imageUrl 
    ? { uri: eventDetail.imageUrl }
    : require('@/assets/events/event_banner.png');

  return (
    <View style={styles.container}>
      <ImageBackground
        source={bannerSource}
        style={styles.banner}
        imageStyle={styles.bannerImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
        </View>
      </ImageBackground>

      <View style={styles.infoRow}>
        <View style={styles.dateGroup}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color="#000"
            style={{ marginTop: 1 }}
          />
          <Text style={styles.infoText}>{dateStr}</Text>
        </View>

        <Text style={styles.infoText}>{dayCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginTop: 4,
    width: '100%',
  },

  banner: {
    width: '100%',
    aspectRatio: 343 / 132,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
  },

  bannerImage: {
    width: '100%',
    height: '100%',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,20,40,0.35)',
  },

  content: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  infoRow: {
    paddingVertical: 5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    width: '100%',
  },

  infoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
