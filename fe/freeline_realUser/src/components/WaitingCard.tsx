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

  return (
    <Pressable onPress={onOpen} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>{waiting.booth_name}</Text>
          <Text style={styles.code}>{waiting.locationCode ?? '위치 정보 없음'}</Text>
        </View>
        <View style={[styles.badge, waiting.status === 'CALLED' ? styles.badgeAccent : null]}>
          <Text style={[styles.badgeText, waiting.status === 'CALLED' ? styles.badgeAccentText : null]}>
            {formatWaitingStatus(waiting.status)}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Feather color={palette.textMuted} name="layers" size={16} />
        <Text style={styles.meta}>내 대기번호: {waiting.my_rank}번째</Text>
      </View>

      <View style={styles.row}>
        <Feather color={palette.textMuted} name="clock" size={16} />
        <Text style={styles.meta}>{formatMinutes(waiting.estimatedMinutes)}</Text>
      </View>

      {waiting.status === 'CALLED' ? (
        <Text style={styles.alert}>입장 5분 전입니다. 도착 인증을 진행해주세요.</Text>
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
    gap: 12,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meta: {
    fontSize: 14,
    color: palette.text,
  },
  alert: {
    fontSize: 13,
    color: palette.inkMuted,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
});
