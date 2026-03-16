import { ScrollView, StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BottomTabBar, { TabKey } from '@/components/navigation/BottomTabBar';
import HomeBanner from '@/components/home/HomeBanner';
import PopularBoothCard from '@/components/home/PopularBoothCard';

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
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>현재 예약 현황</Text>
            </View>

            <View style={styles.reservationBlock}>
              <Text style={styles.emptyPrimary}>아직 예약한 부스가 없네요.</Text>
              <Text style={styles.emptySecondary}>
                지도를 보고 관심 있는 부스를 예약해 보세요!
              </Text>

              <Pressable style={styles.ctaButton} onPress={() => router.replace('/map')}>
                <Text style={styles.ctaButtonText}>예약하러 가기</Text>
              </Pressable>
            </View>
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

  bellText: {
    fontSize: 24,
  },

  section: {
    marginTop: 22,
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

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
  },

  experienceBlock: {
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  reservationBlock: {
    backgroundColor: '#EDEDF2',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },

  emptyPrimary: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
  },

  emptySecondary: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#A09EAB',
    textAlign: 'center',
  },

  ctaButton: {
    marginTop: 18,
    minWidth: 186,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 2,
  },

  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
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
