import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import SectionCard from '@/components/common/SectionCard';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import ReservationCard from '@/components/reservation/ReservationCard';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SectionCard title="현재 예약 현황">
            <ReservationCard
              boothName="현대 글로비스"
              myOrderText="13번째"
              estimatedWaitText="약 25분"
              actionLabel="즉시 입장"
              actionTone="yellow"
            />
            <ReservationCard
              boothName="두산"
              myOrderText="10번째"
              estimatedWaitText="약 45분"
              actionLabel="정보 더보기"
              actionTone="blue"
            />
          </SectionCard>

          <SectionCard title="현재 인기 부스">
            <ReservationCard
              boothName="LS 일렉트릭"
              myOrderText="20번째"
              estimatedWaitText="약 47분"
              actionLabel="예약 중"
              actionTone="green"
            />
          </SectionCard>
        </ScrollView>

        <BottomTabBar activeTab="home" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  page: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 20,
  },
});
