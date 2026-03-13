import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar, { TabKey } from '@/components/navigation/BottomTabBar';
import HomeBanner from '@/components/home/HomeBanner';
import StatusCard from '@/components/home/StatusCard';
import ReservationCard from '@/components/reservation/ReservationCard';

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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>홈화면</Text>

        <HomeBanner />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current experience status</Text>
          <StatusCard title="There is no booth currently in progress." />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current reservation status</Text>
          <StatusCard
            title="You do not have any reservations yet."
            description="Browse the booth map and reserve a booth you're interested in."
            buttonLabel="Go to map"
            onPress={() => router.replace('/map')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular booths right now</Text>

          <View style={styles.cardList}>
            <ReservationCard
              boothName="현대 글로비스"
              myOrderText="13번"
              estimatedWaitText="약 25분"
              statusLabel="대기 중"
              statusTone="blue"
              actionLabel="상세보기"
              actionTone="green"
              onActionPress={() => router.replace('/reservation')}
            />

            <ReservationCard
              boothName="두산"
              myOrderText="10번"
              estimatedWaitText="약 45분"
              statusLabel="예약 중"
              statusTone="green"
              actionLabel="상세보기"
              actionTone="blue"
              onActionPress={() => router.replace('/reservation')}
            />

            <ReservationCard
              boothName="LS 일렉트릭"
              myOrderText="20번"
              estimatedWaitText="약 1시간 20분"
              statusLabel="운영 중"
              statusTone="yellow"
              actionLabel="상세보기"
              actionTone="blue"
              onActionPress={() => router.replace('/reservation')}
            />
          </View>
        </View>
      </ScrollView>

      <BottomTabBar activeTab="home" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 18,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
  },
  cardList: {
    gap: 12,
  },
});
