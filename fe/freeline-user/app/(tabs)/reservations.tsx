import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { WaitingCard } from '@/components/WaitingCard';
import { useAppData } from '@/features/app-data/context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';

const filters = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '현재 예약' },
  { key: 'history', label: '완료/취소' },
] as const;

export default function ReservationsScreen() {
  usePageTracking('reservations');
  const [filter, setFilter] = useState<(typeof filters)[number]['key']>('all');
  const { cancelWaiting, history, lastError, postponeWaiting, queueWaitings } = useAppData();

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

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>현재 예약</Text>
              <Text style={styles.summaryValue}>{queueWaitings.length}건</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>세션 이력</Text>
              <Text style={styles.summaryValue}>{history.length}건</Text>
            </View>
          </View>

          {lastError ? <ErrorBanner message={lastError} /> : null}

          {filter === 'history' ? (
            history.length ? (
              <View style={styles.historyList}>
                {history.map((item) => (
                  <View key={`${item.waitingId}-${item.timestamp}`} style={styles.historyCard}>
                    <Text style={styles.historyTitle}>{item.boothName}</Text>
                    <Text style={styles.historyMeta}>{item.status}</Text>
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
                  onCancel={() => void cancelWaiting(waiting)}
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

        <FloatingTabBar />
      </View>
    </Screen>
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryValue: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
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
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
  },
  historyMeta: {
    color: palette.textMuted,
  },
  historyTime: {
    fontSize: 12,
    color: palette.textMuted,
  },
});
