import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import BottomTabBar, { type TabKey } from '@/components/navigation/BottomTabBar';
import { TAB_ROUTES } from '@/constants/tabRoutes';
import HomeBanner from '@/components/home/HomeBanner';
import ExperienceCard from '@/components/home/ExperienceCard';
import ReservationCard from '@/components/reservation/ReservationCard';
import { useAuthSession } from '@/features/auth/auth-session.context';
import { getEventDetail } from '@/features/event/event.api';
import type { EventDetail } from '@/features/event/types';
import { getMyWaitings } from '@/features/waiting/waiting.api';
import type { WaitingItem } from '@/features/waiting/types';
import type { ExperienceState } from '@/types/experience';

type ReservationSummaryItem = {
  waitingId: number;
  boothName: string;
  statusLabel: string;
  statusTone: 'blue' | 'yellow' | 'green' | 'red' | 'gray';
  myOrderText?: string;
  estimatedWaitText?: string;
};

function getReservationStatus(item: WaitingItem) {
  switch (item.status) {
    case 'CALLED':
      return { label: '호출됨', tone: 'yellow' as const };
    case 'REGISTERED':
      return { label: '도착 인증 완료', tone: 'green' as const };
    case 'ENTERED':
      return { label: '이용 중', tone: 'green' as const };
    case 'EXITED':
      return { label: '이용 종료', tone: 'gray' as const };
    case 'CANCELED':
      return { label: '예약 취소', tone: 'gray' as const };
    case 'EXPIRED':
      return { label: '자동 취소', tone: 'red' as const };
    case 'WAITING':
    default:
      return { label: '정상 대기 중', tone: 'blue' as const };
  }
}

function buildExperienceState(waitings: WaitingItem[]): ExperienceState {
  const activeItem = waitings.find((item) =>
    ['CALLED', 'REGISTERED', 'ENTERED'].includes(item.status),
  );

  if (!activeItem) {
    return { status: 'idle' };
  }

  if (activeItem.status === 'CALLED') {
    return {
      status: 'called',
      boothName: activeItem.booth_name,
    };
  }

  return {
    status: 'active',
    boothName: activeItem.booth_name,
    elapsedTime:
      activeItem.status === 'REGISTERED' ? '도착 인증이 완료되었습니다.' : '현재 체험이 진행 중입니다.',
    remainingTime:
      activeItem.status === 'REGISTERED'
        ? '부스 관리자 확인 후 입장 처리됩니다.'
        : '체험이 끝났다면 예약 관리 화면에서 이용 종료를 눌러주세요.',
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { accessToken } = useAuthSession();

  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [waitings, setWaitings] = useState<WaitingItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const loadData = useCallback(async () => {
    if (!accessToken) {
      setEventDetail(null);
      setWaitings([]);
      setLoadingEvent(false);
      return;
    }

    try {
      setLoadingEvent(true);
      const [eventData, waitingData] = await Promise.all([
        getEventDetail(accessToken),
        getMyWaitings(accessToken),
      ]);

      setEventDetail(eventData);
      setWaitings(waitingData.waitings);
    } catch (error) {
      console.error('홈 화면 데이터 조회 실패:', error);
    } finally {
      setLoadingEvent(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const experienceData = useMemo(() => buildExperienceState(waitings), [waitings]);

  const reservationItems = useMemo<ReservationSummaryItem[]>(() => {
    return waitings
      .filter((item) => !['EXITED', 'CANCELED', 'EXPIRED'].includes(item.status))
      .slice(0, 3)
      .map((item) => {
        const status = getReservationStatus(item);

        return {
          waitingId: item.waiting_id,
          boothName: item.booth_name,
          statusLabel: status.label,
          statusTone: status.tone,
          myOrderText:
            typeof item.my_rank === 'number' && item.my_rank > 0
              ? `${item.my_rank}번째`
              : undefined,
          estimatedWaitText:
            item.status === 'REGISTERED'
              ? '도착 인증 완료'
              : item.status === 'ENTERED'
                ? '체험 진행 중'
                : undefined,
        };
      });
  }, [waitings]);

  const handleTabPress = (tab: TabKey) => {
    router.replace(TAB_ROUTES[tab]);
  };

  const handleExperiencePress = () => {
    const activeWaiting = waitings.find((item) =>
      ['CALLED', 'REGISTERED', 'ENTERED'].includes(item.status),
    );

    if (!activeWaiting) {
      router.push('/maps');
      return;
    }

    if (activeWaiting.status === 'CALLED') {
      router.push({
        pathname: '/qr/scan',
        params: {
          waitingId: String(activeWaiting.waiting_id),
          boothName: activeWaiting.booth_name,
          from: 'home',
        },
      });
      return;
    }

    router.push('/reservation');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
              <Image source={require('@/assets/main/logo.png')} />
            </View>
            <Text style={styles.brandText}>줄서잇</Text>
          </View>

          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
          >
            <Image
              source={require('@/assets/icons/notifications.png')}
              style={styles.icon}
            />
          </Pressable>
        </View>

        <HomeBanner eventDetail={eventDetail} loading={loadingEvent} />

        <View style={styles.expSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>현재 체험 현황</Text>
          </View>
          <ExperienceCard
            data={experienceData}
            onPrimaryPress={handleExperiencePress}
            onSecondaryPress={() => router.push('/reservation')}
          />
        </View>

        <View style={styles.graySection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>현재 예약 현황</Text>
          </View>

          <View style={styles.reservationSectionBox}>
            {reservationItems.length === 0 ? (
              <Text style={styles.contentText}>
                아직 예약한 부스가 없네요.{'\n'}배치도에서 관심 있는 부스를 예약해보세요.
              </Text>
            ) : (
              <View style={styles.homeCardList}>
                {reservationItems.map((item) => (
                  <View key={item.waitingId} style={styles.reservationCardWrap}>
                    <ReservationCard
                      boothName={item.boothName}
                      myOrderText={item.myOrderText}
                      estimatedWaitText={item.estimatedWaitText}
                      statusLabel={item.statusLabel}
                      statusTone={item.statusTone}
                    />
                  </View>
                ))}
              </View>
            )}

            <Pressable style={styles.primaryButton} onPress={() => router.push('/maps')}>
              <Text style={styles.primaryButtonText}>
                {reservationItems.length === 0 ? '예약하러 가기' : '부스 더 보기'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar activeTab="home" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  graySection: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  reservationSectionBox: {
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  homeCardList: {
    marginTop: 4,
    marginBottom: 12,
  },
  reservationCardWrap: {
    marginBottom: 12,
  },
  contentText: {
    paddingVertical: 20,
    fontFamily: 'Pretendard-Bold',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: '#A09EAB',
  },
  primaryButton: {
    alignSelf: 'center',
    backgroundColor: '#2F2C53',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 186,
  },
  primaryButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 130,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingHorizontal: 20,
    minHeight: 200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#2F2C48',
    marginRight: 8,
  },
  logoWrap: {
    width: 22,
    height: 30,
    marginRight: 10,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
});
