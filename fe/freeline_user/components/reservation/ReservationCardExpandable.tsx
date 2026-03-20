import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReservationCard from './ReservationCard';

type ReservationStatus =
  | 'waiting'
  | 'called'
  | 'registered'
  | 'entered'
  | 'completed'
  | 'canceled'
  | 'autocanceled';

type ExpandableReservationItem = {
  waitingId: string;
  boothName: string;
  myRank?: number;
  estimatedWaitMinutes?: number;
  boothLocation?: string;
  reservedAt?: string;
  notice?: string;
  status: ReservationStatus;
};

type Props = {
  item: ExpandableReservationItem;
  onQrPress?: () => void;
  onDeferPress?: () => void;
  onCancelPress?: () => void;
};

function getStatusUI(status: ReservationStatus) {
  switch (status) {
    case 'called':
      return {
        label: '호출됨' as const,
        tone: 'yellow' as const,
      };
    case 'registered':
      return {
        label: '도착 인증 완료' as const,
        tone: 'green' as const,
      };
    default:
      return {
        label: '정상 대기 중' as const,
        tone: 'blue' as const,
      };
  }
}

export default function ReservationCardExpandable({
  item,
  onQrPress,
  onDeferPress,
  onCancelPress,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const statusUI = getStatusUI(item.status);
  const isCalled = item.status === 'called';
  const isRegistered = item.status === 'registered';

  return (
    <ReservationCard
      boothName={item.boothName}
      myOrderText={typeof item.myRank === 'number' ? `${item.myRank}번째` : undefined}
      estimatedWaitText={
        typeof item.estimatedWaitMinutes === 'number'
          ? `약 ${item.estimatedWaitMinutes}분`
          : undefined
      }
      statusLabel={statusUI.label}
      statusTone={statusUI.tone}
      onCardPress={() => setExpanded((prev) => !prev)}
      showDivider={true}
      expandIndicator={
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#FFFFFF"
        />
      }
    >
      {expanded ? (
        <>
          {!!item.boothLocation && (
            <InfoRow icon="location-outline" text={`부스 위치  ${item.boothLocation}`} />
          )}

          {!!item.reservedAt && (
            <InfoRow icon="time-outline" text={`접수 시간  ${item.reservedAt}`} />
          )}

          <View style={styles.noticeBlock}>
            <View style={styles.noticeTitleRow}>
              <Ionicons name="warning-outline" size={16} color="#D7FF2F" />
              <Text style={styles.noticeTitle}>안내 사항</Text>
            </View>

            <Text style={styles.noticeText}>
              {item.notice ??
                '입장 알림(카톡/푸시) 수신 후 5분 내 미입장 시 예약이 자동 취소되니 근처에서 대기해 주세요.'}
            </Text>
          </View>

          {isRegistered ? (
            <Pressable style={styles.fullGreenButton} onPress={onQrPress}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.fullGreenButtonText}>도착 인증 완료</Text>
            </Pressable>
          ) : (
            <View style={styles.buttonRow}>
              <Pressable style={styles.grayButton} onPress={onDeferPress}>
                <Text style={styles.grayButtonText}>순서 미루기</Text>
              </Pressable>

              {isCalled ? (
                <Pressable style={styles.greenButton} onPress={onQrPress}>
                  <Text style={styles.greenButtonText}>도착 인증</Text>
                </Pressable>
              ) : null}

              <Pressable style={styles.redButton} onPress={onCancelPress}>
                <Text style={styles.redButtonText}>취소</Text>
              </Pressable>
            </View>
          )}
        </>
      ) : null}
    </ReservationCard>
  );
}

function InfoRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#D7FF2F" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#F3F4FA',
    fontSize: 14,
    fontWeight: '500',
  },
  noticeBlock: {
    marginTop: 4,
  },
  noticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  noticeTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  noticeText: {
    color: '#F3F4FA',
    fontSize: 13,
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 8,
  },
  grayButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#A9A7B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  greenButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#20C189',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  redButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FF5454',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  fullGreenButton: {
    marginTop: 8,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#20C189',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fullGreenButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
