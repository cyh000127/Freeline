import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { DecoratedWaiting } from '@/features/app-data/types';
import { palette } from '@/theme/colors';
import { formatMinutes, formatWaitingStatus } from '@/utils/format';
import { ActionButton } from './ActionButton';

type Props = {
  waiting: DecoratedWaiting;
  onOpen: () => void;
  onCancel: () => void;
  onPostpone?: () => void;
  onScan?: () => void;
  onExit?: () => void;
};

export function WaitingCard({
  waiting,
  onOpen,
  onCancel,
  onPostpone,
  onScan,
  onExit,
}: Props) {
  const canPostpone = waiting.status === 'WAITING' && waiting.postpone_available && onPostpone;
  const canScan = waiting.status === 'CALLED' && onScan;
  const canExit = waiting.status === 'ENTERED' && onExit;
  const statusAccent = waiting.status === 'CALLED' || waiting.status === 'ENTERED';

  return (
    <Pressable onPress={onOpen} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>{waiting.booth_name}</Text>
          <Text style={styles.code}>{waiting.locationCode ?? '위치 정보 없음'}</Text>
        </View>
        <View style={[styles.badge, statusAccent ? styles.badgeAccent : null]}>
          <Text style={[styles.badgeText, statusAccent ? styles.badgeAccentText : null]}>
            {formatWaitingStatus(waiting.status)}
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.primaryMetric}>
          <Text style={styles.metricLabel}>내 순서</Text>
          <Text style={styles.metricValue}>{waiting.my_rank}</Text>
          <Text style={styles.metricSub}>번째 대기 중</Text>
        </View>

        <View style={styles.metaPanel}>
          <View style={styles.metaRow}>
            <Feather color={palette.textMuted} name="clock" size={15} />
            <Text style={styles.meta}>{formatMinutes(waiting.estimatedMinutes)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Feather color={palette.textMuted} name="map-pin" size={15} />
            <Text style={styles.meta}>{waiting.locationCode ?? '위치 정보 없음'}</Text>
          </View>
        </View>
      </View>

      {waiting.status === 'CALLED' ? (
        <View style={styles.alertCard}>
          <Feather color="#9A6300" name="bell" size={16} />
          <Text style={styles.alert}>입장 5분 전입니다. 도착 인증을 진행해주세요.</Text>
        </View>
      ) : null}

      {waiting.status === 'ENTERED' ? (
        <View style={styles.alertCardSecondary}>
          <Feather color={palette.success} name="check-circle" size={16} />
          <Text style={styles.alertSecondary}>현재 체험 진행 중입니다. 종료 후 상태를 업데이트하세요.</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {canScan ? <ActionButton grow label="도착 인증하기" onPress={onScan} variant="secondary" /> : null}
        {canPostpone ? (
          <ActionButton grow label="순서 미루기" onPress={onPostpone} variant="ghost" />
        ) : null}
        {canExit ? <ActionButton grow label="체험 종료하기" onPress={onExit} variant="secondary" /> : null}
        <ActionButton
          grow={!(canPostpone || canScan || canExit)}
          label={waiting.status === 'ENTERED' ? '상세 보기' : '예약 취소'}
          onPress={waiting.status === 'ENTERED' ? onOpen : onCancel}
          variant="ghost"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBox: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  code: {
    fontSize: 12,
    color: palette.textMuted,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surfaceAlt,
  },
  badgeAccent: {
    backgroundColor: '#FFF5D8',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textMuted,
  },
  badgeAccentText: {
    color: '#9A6300',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryMetric: {
    flex: 0.9,
    backgroundColor: palette.ink,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 2,
  },
  metricLabel: {
    color: '#D6D4E6',
    fontSize: 12,
    fontWeight: '800',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
  },
  metricSub: {
    color: '#D6D4E6',
    fontSize: 12,
  },
  metaPanel: {
    flex: 1,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meta: {
    flex: 1,
    fontSize: 13,
    color: palette.text,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF5D8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  alertCardSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAFBF1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  alert: {
    flex: 1,
    fontSize: 13,
    color: '#9A6300',
    lineHeight: 18,
  },
  alertSecondary: {
    flex: 1,
    fontSize: 13,
    color: palette.success,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
});
