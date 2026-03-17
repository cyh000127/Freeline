import { ScrollView, StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BottomTabBar, { TabKey } from '@/components/navigation/BottomTabBar';
import HomeBanner from '@/components/home/HomeBanner';
import PopularBoothCard from '@/components/home/PopularBoothCard';
import { useQRMock } from '@/app/contexts/QRMockContext';

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
  const { waitings } = useQRMock();

  const handleTabPress = (tab: TabKey) => {
    router.replace(TAB_ROUTES[tab]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logoWrap}>
                <Text style={styles.logoMark}>L</Text>
                <View style={styles.logoDot} />
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

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>현재 체험 현황</Text>
            </View>

            <View style={styles.experienceBlock}>
              <Text style={styles.emptyPrimary}>현재 체험 중인 부스가 없습니다.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>현재 예약 현황</Text>

            {waitings.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>현재 예약된 부스가 없습니다.</Text>
              </View>
            ) : (
              <View style={styles.homeCardList}>
                {waitings.map((item) => {
                  const isDone = item.verificationState === 'done';
                  const isAvailable = item.verificationState === 'on';

                  return (
                    <View key={item.waitingId} style={styles.homeCard}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.boothName}>{item.boothName}</Text>

                        {isDone ? (
                          <Text style={styles.doneText}>완료</Text>
                        ) : (
                          <Text style={styles.rankText}>{item.myRank}번</Text>
                        )}
                      </View>

                      <View style={styles.rowBetween}>
                        <Text style={styles.subText}>
                          {isDone
                            ? '도착 인증 완료'
                            : isAvailable
                              ? '지금 입장 가능합니다'
                              : '대기 중'}
                        </Text>

                        {isAvailable && !isDone && (
                          <Pressable
                            style={styles.verifyButton}
                            onPress={() =>
                              router.push({
                                pathname: '/qr/scan',
                                params: {
                                  waitingId: item.waitingId,
                                  boothName: item.boothName,
                                  from: 'home',
                                },
                              })
                            }
                          >
                            <Text style={styles.verifyText}>도착 인증</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>현재 인기 부스</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>◔</Text>
              <Text style={styles.infoText}>3월 6일 16:00 기준</Text>
            </View>

            <ScrollView
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
            </ScrollView>
          </View>
        </ScrollView>

        <BottomTabBar activeTab="home" onTabPress={handleTabPress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },

  screen: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 130,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 18,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  section: {
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111111',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#2F2C48',
    marginRight: 8,
  },

  logoWrap: {
    width: 30,
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

  experienceBlock: {
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  emptyPrimary: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
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

  homeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  boothName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },

  rankText: {
    fontSize: 14,
    color: '#666666',
  },

  subText: {
    fontSize: 13,
    color: '#888888',
  },

  verifyButton: {
    backgroundColor: '#3C355F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  verifyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  doneText: {
    color: '#00A86B',
    fontWeight: '600',
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
