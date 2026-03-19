import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BottomTabBar, { TabKey } from '@/components/navigation/BottomTabBar';
import ReservationCard from '@/components/reservation/ReservationCard';
import { useQRMock } from '@/app/contexts/QRMockContext';

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
  const { waitings, resetMock } = useQRMock();

  const handleTabPress = (tab: TabKey) => {
    router.replace(TAB_ROUTES[tab]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <Text style={styles.title}>예약 내역</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>현재 예약 현황</Text>
            <Pressable onPress={resetMock}>
              <Text style={styles.resetText}>초기화</Text>
            </Pressable>
          </View>

          {waitings.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>현재 예약된 부스가 없습니다.</Text>
            </View>
          ) : (
            <View style={styles.cardList}>
              {waitings.map((item) => {
                const isDone = item.verificationState === 'done';
                const isAvailable = item.verificationState === 'on';

                return (
                  <View key={item.waitingId} style={styles.cardItem}>
                    <ReservationCard
                      boothName={item.boothName}
                      myOrderText={`${item.myRank}번`}
                      estimatedWaitText={isDone ? '도착 인증 완료' : '약 25분'}
                      statusLabel={
                        isDone ? '완료' : isAvailable ? '입장 예정' : '대기 중'
                      }
                      statusTone={isDone ? 'green' : isAvailable ? 'yellow' : 'blue'}
                      actionLabel={
                        isDone ? '완료됨' : isAvailable ? '도착 인증' : '상세보기'
                      }
                      actionTone={isDone ? 'blue' : isAvailable ? 'green' : 'blue'}
                      expanded={!isDone}
                      details={
                        isDone
                          ? ['QR 인증이 완료되었습니다.']
                          : [
                              '예약 시간: 14:30',
                              '부스 위치: A-12',
                              isAvailable
                                ? '지금 도착 인증이 가능합니다.'
                                : '아직 도착 인증 가능 상태가 아닙니다.',
                            ]
                      }
                      onActionPress={
                        isDone
                          ? undefined
                          : isAvailable
                            ? () =>
                                router.push({
                                  pathname: '/qr/scan',
                                  params: {
                                    waitingId: item.waitingId,
                                    boothName: item.boothName,
                                    from: 'reservation',
                                  },
                                })
                            : undefined
                      }
                    />
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.pastSection}>
            <Text style={styles.sectionTitle}>지난 예약 내역</Text>

            <View style={styles.cardItem}>
              <ReservationCard
                boothName="LG CNS"
                myOrderText="완료"
                estimatedWaitText="입장 완료"
                statusLabel="완료"
                statusTone="green"
                actionLabel="리뷰 작성"
                actionTone="blue"
              />
            </View>
          </View>
        </ScrollView>

        <BottomTabBar activeTab="reservation" onTabPress={handleTabPress} />
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

  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 130,
  },

  header: {
    marginTop: 8,
    marginBottom: 18,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },

  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A09EAB',
  },

  cardList: {
    marginTop: 4,
  },

  cardItem: {
    marginBottom: 14,
  },

  pastSection: {
    marginTop: 8,
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
  },
});
