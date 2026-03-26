import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReservationCard from './ReservationCard';

type ReservationStatus =
  | 'WAITING'
  | 'CALLED'
  | 'REGISTERED'
  | 'ENTERED'
  | 'EXITED'
  | 'CANCELED'
  | 'EXPIRED';

type ExpandableReservationItem = {
  waitingId: string;
  boothName: string;
  myRank?: number;
  estimatedWaitText?: string;
  boothLocation?: string;
  reservedAt?: string;
  notice?: string;
  canPostpone?: boolean;
  status: ReservationStatus;
};

type Props = {
  item: ExpandableReservationItem;
  onQrPress?: () => void;
  onPostponePress?: () => void;
  onCancelPress?: () => void;
  onExitPress?: () => void;
};

function getStatusUI(status: ReservationStatus) {
  switch (status) {
    case 'CALLED':
      return {
        label: '호출됨' as const,
        tone: 'yellow' as const,
      };
    case 'REGISTERED':
      return {
        label: '도착 인증 완료' as const,
        tone: 'green' as const,
      };
    case 'ENTERED':
      return {
        label: '입장 완료' as const,
        tone: 'green' as const,
      };
    case 'EXITED':
      return {
        label: '이용 종료' as const,
        tone: 'gray' as const,
      };
    case 'CANCELED':
      return {
        label: '예약 취소' as const,
        tone: 'gray' as const,
      };
    case 'EXPIRED':
      return {
        label: '자동 취소' as const,
        tone: 'red' as const,
      };
    case 'WAITING':
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
  onPostponePress,
  onCancelPress,
  onExitPress,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const statusUI = getStatusUI(item.status);
  const isWaiting = item.status === 'WAITING';
  const isCalled = item.status === 'CALLED';
  const isRegistered = item.status === 'REGISTERED';
  const isEntered = item.status === 'ENTERED';

  return (
    <ReservationCard
      boothName={item.boothName}
      myOrderText={typeof item.myRank === 'number' ? `${item.myRank}번째` : undefined}
      estimatedWaitText={item.estimatedWaitText}
      statusLabel={statusUI.label}
      statusTone={statusUI.tone}
      onCardPress={() => setExpanded((prev) => !prev)}
      showDivider={true}
      expandIndicator={
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="rgba(255,255,255,0.85)"
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
            <View style={styles.fullGreenButton}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.fullGreenButtonText}>도착 인증 완료</Text>
            </View>
          ) : isEntered ? (
            <Pressable style={styles.fullGreenButton} onPress={onExitPress}>
              <Ionicons name="exit-outline" size={18} color="#FFFFFF" />
              <Text style={styles.fullGreenButtonText}>이용 종료</Text>
            </Pressable>
          ) : (
            <View style={styles.buttonRow}>
              {isWaiting && item.canPostpone ? (
                <Pressable style={styles.grayButton} onPress={onPostponePress}>
                  <Text style={styles.grayButtonText}>순서 미루기</Text>
                </Pressable>
              ) : null}

              {isCalled ? (
                <Pressable style={styles.greenButton} onPress={onQrPress}>
                  <Text style={styles.greenButtonText}>도착 인증</Text>
                </Pressable>
              ) : null}

              {isWaiting || isCalled ? (
                <Pressable style={styles.redButton} onPress={onCancelPress}>
                  <Text style={styles.redButtonText}>취소</Text>
                </Pressable>
              ) : null}
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
    gap: 10,
  },

  infoText: {
    color: '#F3F4FA',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  noticeBlock: {
    marginTop: 10,
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
    lineHeight: 20,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  grayButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
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
    height: 44,
    borderRadius: 10,
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
    height: 44,
    borderRadius: 10,
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
    marginTop: 12,
    height: 44,
    borderRadius: 10,
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
