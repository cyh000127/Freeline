import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReservationCard from '@/components/reservation/ReservationCard';
import type { EventBoothItem } from '@/features/booth/types';

type Props = {
  booths: EventBoothItem[];
  emptyText: string;
  onBoothPress: (boothId: number) => void;
};

function formatOperatingTime(openTime: string, closeTime: string) {
  return `${openTime.slice(0, 5)} - ${closeTime.slice(0, 5)}`;
}

export default function BoothListSection({
  booths,
  emptyText,
  onBoothPress,
}: Props) {
  if (booths.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {booths.map((booth) => (
        <ReservationCard
          key={booth.boothId}
          boothName={booth.name}
          boothLocationText={booth.locationCode}
          visitTimeText={formatOperatingTime(booth.openTime, booth.closeTime)}
          statusLabel={booth.isEmergencyClosed ? '긴급 마감' : '예약 가능'}
          statusTone={booth.isEmergencyClosed ? 'red' : 'green'}
          showDivider={true}
        >
          <View style={styles.cardActions}>
            <Text style={styles.cardHelper}>
              {booth.isEmergencyClosed
                ? '현재 긴급 마감 상태입니다.'
                : '상세 화면에서 예상 대기 시간과 굿즈를 확인할 수 있어요.'}
            </Text>

            <Pressable
              style={[
                styles.reserveButton,
                booth.isEmergencyClosed && styles.reserveButtonDisabled,
              ]}
              disabled={booth.isEmergencyClosed}
              onPress={() => onBoothPress(booth.boothId)}
            >
              <Text style={styles.reserveButtonText}>상세 보기</Text>
            </Pressable>
          </View>
        </ReservationCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#888888',
    textAlign: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHelper: {
    flex: 1,
    color: '#F3F4FA',
    fontSize: 13,
    lineHeight: 20,
  },
  reserveButton: {
    minWidth: 92,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#D7FF2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveButtonDisabled: {
    backgroundColor: '#8B8999',
  },
  reserveButtonText: {
    color: '#1E1B35',
    fontSize: 14,
    fontWeight: '800',
  },
});
