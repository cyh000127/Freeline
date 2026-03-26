import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { BrandMark } from '@/components/BrandMark';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { HeroEventCard } from '@/components/HeroEventCard';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { WaitingCard } from '@/components/WaitingCard';
import { useAppData } from '@/features/app-data/context';
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

  if (!eventProfile) {
    return <Screen />;
  }

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

          {queueWaitings.map((waiting) => (
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

          <ActionButton
            label="배치도에서 부스 찾기"
            onPress={() => router.replace('/(tabs)/map')}
          />
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
