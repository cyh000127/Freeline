import { ScrollView, StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar, { TabKey } from '@/components/navigation/BottomTabBar';
import HomeBanner from '@/components/home/HomeBanner';
// import PopularBoothCard from '@/components/home/PopularBoothCard';
// import { useQRMock } from '@/app/contexts/QRMockContext';
// import ReservationCard from '@/components/reservation/ReservationCard';
import { useExperienceMock } from '@/mocks/useExperienceMock';
import ExperienceCard from '@/components/home/ExperienceCard';

const TAB_ROUTES: Record<TabKey, '/home' | '/reservation' | '/map' | '/my' | '/search'> =
  {
    home: '/home',
    reservation: '/reservation',
    map: '/map',
    my: '/my',
    search: '/search',
  };

export default function HomeScreen() {
  const router = useRouter();
  // const { waitings } = useQRMock();

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

          <Pressable style={styles.bellButton}>
            <Image
              source={require('@/assets/icons/notifications.png')}
              style={styles.icon}
            />
          </Pressable>
        </View>

        <HomeBanner />
        <View style={styles.expSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>현재 체험 현황</Text>
          </View>
          <ExperienceCard data={data} onPrimaryPress={() => console.log('action')} />
        </View>
        <View style={styles.graySection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>현재 예약 현황</Text>
          </View>
          {/* {waitings.length === 0 ? ( */}
          <View style={styles.emptyBox}>
            <Text style={styles.contentText}>
              아직 예약한 부스가 없네요.{'\n'}지도를 보고 관심 있는 부스를 예약해보세요!
            </Text>
            <Pressable style={styles.purpleButton} onPress={() => router.push('/map')}>
              <Text style={styles.btnText}>예약하러 가기</Text>
            </Pressable>
          </View>
          {/* { ) : (
            <View style={styles.homeCardList}>
              {waitings.map((item) => {
                const isDone = item.verificationState === 'done';
                const isAvailable = item.verificationState === 'on';

                return (
                  <View key={item.waitingId} style={styles.reservationCardWrap}>
                    <ReservationCard
                      boothName={item.boothName}
                      myOrderText={isDone ? undefined : `${item.myRank}번째`}
                      estimatedWaitText={
                        isDone ? undefined : isAvailable ? '지금 입장 가능' : '대기 중'
                      }
                      actionLabel={
                        isDone ? '도착 인증 완료' : isAvailable ? '도착 인증' : undefined
                      }
                      actionTone={isDone ? 'green' : isAvailable ? 'yellow' : 'blue'}
                      onActionPress={
                        isAvailable && !isDone
                          ? () =>
                              router.push({
                                pathname: '/qr/scan',
                                params: {
                                  waitingId: item.waitingId,
                                  boothName: item.boothName,
                                  from: 'home',
                                },
                              })
                          : undefined
                      }
                    />
                  </View>
                ); 
              })}
            </View>
          )} */}
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
  },

  scrollContent: {
    // paddingHorizontal: 20,
    // paddingTop: 14,
    paddingBottom: 130,
  },
  reservationCardWrap: {
    marginBottom: 12,
  },
  purpleButton: {
    backgroundColor: '#7C3AED',
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
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

  graySection: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 20,
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

  contentText: {
    paddingVertical: 20,
    fontFamily: 'Pretendard-Bold',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: '#A09EAB',
  },

  bellButton: {
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

  emptyBox: {
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyText: {
    color: '#888888',
  },

  homeCardList: {
    marginTop: 4,
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
  btnText: {
    fontSize: 15,
    color: 'white',
    fontWeight: '500',
  },

  popularRail: {
    paddingRight: 20,
    gap: 12,
  },
});
