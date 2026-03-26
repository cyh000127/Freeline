import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { WaitingCard } from '@/components/WaitingCard';
import { useAppData } from '@/features/app-data/context';
import type { DecoratedWaiting } from '@/features/app-data/types';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';
import { formatHistoryStatus } from '@/utils/format';

const filters = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '현재 예약' },
  { key: 'history', label: '완료/취소' },
] as const;

export default function ReservationsScreen() {
  usePageTracking('reservations');
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('all');
  const { cancelWaiting, history, lastError, postponeWaiting, queueWaitings } = useAppData();
  const [pendingCancel, setPendingCancel] = useState<DecoratedWaiting | null>(null);
  const calledCount = queueWaitings.filter((waiting) => waiting.status === 'CALLED').length;
  const waitingCount = queueWaitings.filter((waiting) => waiting.status === 'WAITING').length;

  const visible = useMemo(() => {
    if (filter === 'active') {
      return queueWaitings;
    }

    if (filter === 'history') {
      return [];
    }

    return queueWaitings;
  }, [filter, queueWaitings]);

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SectionTitle caption="대기 상태를 한눈에 관리하세요" title="예약 관리" />

          <View style={styles.overviewCard}>
            <Text style={styles.overviewTitle}>현재 처리할 예약</Text>
            <Text style={styles.overviewBody}>
              {calledCount
                ? `도착 인증이 필요한 예약 ${calledCount}건이 우선입니다.`
                : queueWaitings.length
                  ? '현재 예약 중인 부스와 세션 내 이력을 한 화면에서 관리할 수 있습니다.'
                  : '아직 진행 중인 예약이 없습니다. 배치도에서 먼저 대기를 등록해보세요.'}
            </Text>
            <View style={styles.overviewStats}>
              <SummaryPill label="도착 인증" value={`${calledCount}건`} />
              <SummaryPill label="대기 중" value={`${waitingCount}건`} />
              <SummaryPill label="세션 이력" value={`${history.length}건`} />
            </View>
          </View>

          <View style={styles.filters}>
            {filters.map((item) => {
              const active = filter === item.key;

              return (
                <Pressable
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[styles.filter, active ? styles.filterActive : null]}
                >
                  <Text style={[styles.filterLabel, active ? styles.filterLabelActive : null]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {lastError ? <ErrorBanner message={lastError} /> : null}

          {filter === 'history' ? (
            history.length ? (
              <View style={styles.historyList}>
                {history.map((item) => (
                  <View key={`${item.waitingId}-${item.timestamp}`} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyTitle}>{item.boothName}</Text>
                      <View style={styles.historyBadge}>
                        <Text style={styles.historyBadgeLabel}>{formatHistoryStatus(item.status)}</Text>
                      </View>
                    </View>
                    <Text style={styles.historyTime}>
                      {new Date(item.timestamp).toLocaleString('ko-KR')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                caption="현재 세션 기준으로 취소하거나 종료한 대기 내역이 여기에 쌓입니다."
                title="아직 완료/취소 내역이 없습니다"
              />
            )
          ) : visible.length ? (
            <View style={styles.list}>
              {visible.map((waiting) => (
                <WaitingCard
                  key={waiting.waiting_id}
                  onCancel={() => setPendingCancel(waiting)}
                  onOpen={() => {
                    if (waiting.boothId) {
                      router.push(`/booths/${waiting.boothId}`);
                    }
                  }}
                  onPostpone={
                    waiting.postpone_available
                      ? () => void postponeWaiting(waiting)
                      : undefined
                  }
                  onScan={
                    waiting.status === 'CALLED'
                      ? () => router.push(`/qr/scan?waitingId=${waiting.waiting_id}`)
                      : undefined
                  }
                  waiting={waiting}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              caption="배치도 화면에서 부스를 선택해 대기를 등록하면 여기에서 관리할 수 있습니다."
              title="표시할 예약이 없습니다"
            />
          )}
        </ScrollView>

        <ConfirmDialog
          body={`${pendingCancel?.booth_name ?? '이 부스'} 예약을 취소할까요? 취소 후에는 다시 대기를 등록해야 합니다.`}
          confirmLabel="예약 취소하기"
          onClose={() => setPendingCancel(null)}
          onConfirm={() => {
            if (pendingCancel) {
              void cancelWaiting(pendingCancel).finally(() => setPendingCancel(null));
            }
          }}
          title="예약을 취소할까요?"
          visible={!!pendingCancel}
        />

        <FloatingTabBar />
      </View>
    </Screen>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryPillLabel}>{label}</Text>
      <Text style={styles.summaryPillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 20,
    paddingBottom: 148,
  },
  overviewCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  overviewTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  overviewBody: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  overviewStats: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  summaryPill: {
    flex: 1,
    minWidth: 96,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  summaryPillLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryPillValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
  },
  filter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: palette.surfaceAlt,
  },
  filterActive: {
    backgroundColor: palette.ink,
  },
  filterLabel: {
    color: palette.textMuted,
    fontWeight: '700',
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  list: {
    gap: 14,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 18,
    gap: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  historyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
  },
  historyBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  historyBadgeLabel: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  historyTime: {
    fontSize: 12,
    color: palette.textMuted,
  },
});
