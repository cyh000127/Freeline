import { useState } from 'react';
import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { BrandMark } from '@/components/BrandMark';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { HeroEventCard } from '@/components/HeroEventCard';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { WaitingCard } from '@/components/WaitingCard';
import { useAppData } from '@/features/app-data/context';
import type { DecoratedWaiting } from '@/features/app-data/types';
import { useSession } from '@/features/session/context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';
import { formatQueueStatus } from '@/utils/format';

export default function HomeScreen() {
  usePageTracking('home');
  const { eventProfile, nickname } = useSession();
  const {
    currentExperience,
    isLoading,
    isRefreshing,
    lastError,
    queueStatus,
    queueWaitings,
    refreshAll,
    cancelWaiting,
    exitWaiting,
    postponeWaiting,
  } = useAppData();
  const [pendingCancel, setPendingCancel] = useState<DecoratedWaiting | null>(null);

  if (!eventProfile) {
    return <Screen />;
  }

  const calledCount = queueWaitings.filter((waiting) => waiting.status === 'CALLED').length;
  const waitingCount = queueWaitings.filter((waiting) => waiting.status === 'WAITING').length;
  const highlightedWaitings = queueWaitings.slice(0, 2);

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => void refreshAll()} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <BrandMark compact />
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{nickname ? `${nickname}님, 반가워요` : '줄서잇'}</Text>
              <Text style={styles.subtitle}>{formatQueueStatus(queueStatus)}</Text>
            </View>
          </View>

          <HeroEventCard
            dateLabel={eventProfile.dateLabel}
            dayLabel={eventProfile.dayLabel}
            imageSource={eventProfile.bannerImage}
            title={eventProfile.name}
            venueLabel={eventProfile.venueLabel}
          />

          <View style={styles.overviewCard}>
            <View style={styles.overviewCopy}>
              <Text style={styles.overviewTitle}>지금 확인할 상태</Text>
              <Text style={styles.overviewBody}>
                {calledCount
                  ? `도착 인증이 필요한 예약이 ${calledCount}건 있습니다.`
                  : currentExperience
                    ? '현재 체험 중인 부스가 있습니다.'
                    : queueWaitings.length
                      ? '예약 중인 부스를 관리해보세요.'
                      : '배치도에서 원하는 부스를 먼저 찾아보세요.'}
              </Text>
            </View>

            <View style={styles.overviewStats}>
              <StatusPill label="도착 인증" value={`${calledCount}건`} />
              <StatusPill label="대기 중" value={`${waitingCount}건`} />
              <StatusPill label="체험 중" value={currentExperience ? '1건' : '0건'} />
            </View>

            <ActionButton
              label={calledCount ? '예약 관리 보기' : '배치도 열기'}
              onPress={() => router.replace(calledCount ? '/(tabs)/reservations' : '/(tabs)/map')}
              variant={calledCount ? 'secondary' : 'ghost'}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>현재 상태</Text>
              <Text style={styles.statValue}>{formatQueueStatus(queueStatus)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>활성 예약</Text>
              <Text style={styles.statValue}>{queueWaitings.length}건</Text>
            </View>
          </View>

          {lastError ? <ErrorBanner message={lastError} /> : null}

          <SectionTitle caption="현재 체험 중인 부스 정보" title="현재 체험 현황" />
          {currentExperience ? (
            <WaitingCard
              onCancel={() => {}}
              onExit={() => void exitWaiting(currentExperience)}
              onOpen={() => {
                if (currentExperience.boothId) {
                  router.push(`/booths/${currentExperience.boothId}`);
                }
              }}
              waiting={currentExperience}
            />
          ) : (
            <EmptyState
              caption="아직 체험 중인 부스가 없습니다. 배치도에서 원하는 부스를 찾아 대기를 걸어보세요."
              title="진행 중인 체험이 없습니다"
            />
          )}

          <SectionTitle caption="현재 예약 중인 대기 현황" title="현재 예약 현황" />
          {isLoading ? <Text style={styles.loading}>불러오는 중...</Text> : null}
          {!isLoading && queueWaitings.length === 0 ? (
            <EmptyState
              caption="관심 있는 부스를 찾아 먼저 대기를 등록해보세요."
              title="현재 예약이 없습니다"
            />
          ) : null}

          {highlightedWaitings.map((waiting) => (
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

          {queueWaitings.length > highlightedWaitings.length ? (
            <ActionButton
              label={`예약 관리에서 전체 ${queueWaitings.length}건 보기`}
              onPress={() => router.replace('/(tabs)/reservations')}
              variant="ghost"
            />
          ) : null}

          <ActionButton
            label="배치도에서 부스 찾기"
            onPress={() => router.replace('/(tabs)/map')}
          />
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

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusPill}>
      <Text style={styles.statusPillLabel}>{label}</Text>
      <Text style={styles.statusPillValue}>{value}</Text>
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
    paddingBottom: 150,
    gap: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerCopy: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: 13,
    color: palette.textMuted,
  },
  loading: {
    color: palette.textMuted,
  },
  overviewCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 16,
  },
  overviewCopy: {
    gap: 6,
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
  statusPill: {
    flex: 1,
    minWidth: 96,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  statusPillLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  statusPillValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 16,
    gap: 8,
  },
  statLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    color: palette.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
});
