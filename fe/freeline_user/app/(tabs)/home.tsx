import { ScrollView, StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar, { TabKey } from '@/components/navigation/BottomTabBar';
import { TAB_ROUTES } from '@/constants/tabRoutes';
import HomeBanner from '@/components/home/HomeBanner';
// import PopularBoothCard from '@/components/home/PopularBoothCard';
// import { useQRMock } from '@/app/contexts/QRMockContext';
import { useExperienceMock } from '@/mocks/useExperienceMock';
import ExperienceCard from '@/components/home/ExperienceCard';
import { useEffect, useMemo, useState } from 'react';
import ReservationCard from '@/components/reservation/ReservationCard';
import { useAuthSession } from '@/features/auth/auth-session.context';
import { getEventDetail } from '@/features/event/event.api';
import type { EventDetail } from '@/features/event/types';

type HomeReservationItem = {
  // 임시 테스트용 예약현황 값
  id: string;
  boothName: string;
  statusLabel: '정상 대기 중' | '호출됨' | '도착 인증 완료';
  statusTone: 'blue' | 'yellow' | 'green';
  myOrderText: string;
  estimatedWaitText: string;
};

const HOME_RESERVATION_SEED: HomeReservationItem[] = [
  {
    id: '1',
    boothName: '현대 글로비스',
    statusLabel: '정상 대기 중',
    statusTone: 'blue',
    myOrderText: '13번째',
    estimatedWaitText: '약 25분',
  },
  {
    id: '2',
    boothName: '두산',
    statusLabel: '호출됨',
    statusTone: 'yellow',
    myOrderText: '5번째',
    estimatedWaitText: '약 10분',
  },
  {
    id: '3',
    boothName: 'LS 일렉트릭',
    statusLabel: '도착 인증 완료',
    statusTone: 'green',
    myOrderText: '2번째',
    estimatedWaitText: '입장 대기 중',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { accessToken, eventId } = useAuthSession();

  const [homeReservations, setHomeReservations] = useState<HomeReservationItem[]>([]);
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  
  useEffect(() => {
    async function fetchEvent() {
      if (!accessToken) {
        setLoadingEvent(false);
        return;
      }
      try {
        setLoadingEvent(true);
        const data = await getEventDetail(accessToken);
        setEventDetail(data);
      } catch (err) {
        console.error('Failed to fetch event for HomeBanner', err);
      } finally {
        setLoadingEvent(false);
      }
    }
    fetchEvent();
  }, [accessToken, eventId]);

  const canAddReservation = homeReservations.length < 3;

  const handleAddReservation = () => {
    if (!canAddReservation) return;

    const nextItem = HOME_RESERVATION_SEED[homeReservations.length];
    if (!nextItem) return;

    setHomeReservations((prev) => [...prev, nextItem]);
  };

  const visibleReservations = useMemo(
    () => homeReservations.slice(0, 3),
    [homeReservations],
  );
  const handleTabPress = (tab: TabKey) => {
    router.replace(TAB_ROUTES[tab]);
  };
  const { data } = useExperienceMock();

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
            data={data}
            onPrimaryPress={() => {
              if (data.status === 'called') {
                router.push({
                  pathname: '/qr/scan',
                  params: {
                    waitingId: '999',
                    boothName: data.boothName,
                    from: 'home',
                  },
                });
              } else {
                console.log('체험 종료 액션');
              }
            }}
          />
        </View>
        <View style={styles.graySection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>현재 예약 현황</Text>
          </View>

          <View style={styles.reservationSectionBox}>
            {visibleReservations.length === 0 ? (
              <Text style={styles.contentText}>
                아직 예약한 부스가 없네요.{'\n'}지도를 보고 관심 있는 부스를 예약해보세요!
              </Text>
            ) : (
              <View style={styles.homeCardList}>
                {visibleReservations.map((item) => (
                  <View key={item.id} style={styles.reservationCardWrap}>
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

            {canAddReservation ? (
              <Pressable style={styles.purpleButton} onPress={() => router.push('/maps')}>
                <Text style={styles.btnText}>
                  {visibleReservations.length === 0 ? '예약하러 가기' : '예약 1개 추가'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        {/* <View style={styles.section}> */}
        {/* <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>현재 인기 부스</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>◔</Text>
              <Text style={styles.infoText}>3월 6일 16:00 기준</Text>
            </View> */}

        {/* <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularRail}
            >
              <PopularBoothCard
                boothName="현대 글로비스"
                waitingCountText="100명"
                estimatedWaitText="약 45분"
                onMapPress={() => router.replace('/map')}
                onReservePress={() => router.replace('/reservation')}
                reserveDisabled={true}
              />

              <PopularBoothCard
                boothName="두산"
                waitingCountText="105명"
                estimatedWaitText="약 50분"
                onMapPress={() => router.replace('/map')}
                onReservePress={() => router.replace('/reservation')}
                reserveDisabled={false}
              />

              <PopularBoothCard
                boothName="LS 일렉트릭"
                waitingCountText="84명"
                estimatedWaitText="약 35분"
                onMapPress={() => router.replace('/map')}
                onReservePress={() => router.replace('/reservation')}
                reserveDisabled={false}
              />
            </ScrollView> */}
        {/* </View> */}
      </ScrollView>

      <BottomTabBar activeTab="home" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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

  emptyBox: {
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },

  contentText: {
    paddingVertical: 20,
    fontFamily: 'Pretendard-Bold',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: '#A09EAB',
  },

  purpleButton: {
    alignSelf: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 186,
  },

  btnText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  scrollContent: {
    // paddingHorizontal: 20,
    // paddingTop: 14,
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
    backgroundColor: 'white',
    paddingTop: 10,
    paddingHorizontal: 20,
    minHeight: 200,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    // marginBottom: 8,
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

  logoMark: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2F2C48',
    lineHeight: 30,
  },

  logoDot: {
    position: 'absolute',
    top: 2,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DBFC53',
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

  emptyPrimary: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
  },

  emptyText: {
    color: '#888888',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 2,
  },

  infoIcon: {
    fontSize: 12,
    color: '#5C5A72',
    marginRight: 6,
  },

  infoText: {
    fontSize: 12,
    color: '#5C5A72',
    fontWeight: '500',
  },

  popularRail: {
    paddingRight: 20,
    gap: 12,
  },
});
