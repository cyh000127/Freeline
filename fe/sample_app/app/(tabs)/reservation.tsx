import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar, { TabKey } from '@/components/navigation/BottomTabBar';
import ReservationCard from '@/components/reservation/ReservationCard';

const TAB_ROUTES: Record<TabKey, '/home' | '/reservation' | '/map' | '/my' | '/search'> =
  {
    home: '/home',
    reservation: '/reservation',
    map: '/map',
    my: '/my',
    search: '/search',
  };

export default function ReservationScreen() {
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
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>예약 관리</Text>
          <Pressable style={styles.addButton} onPress={() => router.replace('/map')}>
            <Text style={styles.addButtonText}>+ 예약 추가</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>진행 중인 예약</Text>
          <View style={styles.cardList}>
            <ReservationCard
              boothName="현대 글로비스"
              myOrderText="13번"
              estimatedWaitText="약 25분"
              statusLabel="대기 중"
              statusTone="blue"
              actionLabel="상세보기"
              actionTone="blue"
              expanded
              details={[
                '예약 시간: 14:30',
                '부스 위치: A-12',
                '입장 알림이 오면 5분 내 방문해주세요.',
              ]}
            />

            <ReservationCard
              boothName="두산"
              myOrderText="10번"
              estimatedWaitText="약 45분"
              statusLabel="입장 예정"
              statusTone="yellow"
              actionLabel="배치도 보기"
              actionTone="green"
              onActionPress={() => router.replace('/map')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>완료 / 지난 예약</Text>
          <View style={styles.cardList}>
            <ReservationCard
              boothName="LS 일렉트릭"
              estimatedWaitText="방문 완료"
              statusLabel="완료"
              statusTone="green"
              actionLabel="다시 보기"
              actionTone="blue"
            />

            <ReservationCard
              boothName="한화"
              estimatedWaitText="예약 취소"
              statusLabel="취소됨"
              statusTone="red"
              actionLabel="재예약"
              actionTone="yellow"
              onActionPress={() => router.replace('/map')}
            />
          </View>
        </View>
      </ScrollView>

      <BottomTabBar activeTab="reservation" onTabPress={handleTabPress} />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#6E5AE6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
