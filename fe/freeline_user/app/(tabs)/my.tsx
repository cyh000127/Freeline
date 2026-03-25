import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { TAB_ROUTES } from '@/constants/tabRoutes';
import MySection from '@/components/my/MySection';
import MyProfileCard from '@/components/my/MyProfileCard';
import MyActionItem from '@/components/my/MyActionItem';
import { useAuthSession } from '@/features/auth/auth-session.context';

export default function My() {
  const router = useRouter();
  const { nickname, clearSession } = useAuthSession();

  const displayNickname =
    typeof nickname === 'string' && nickname.trim().length > 0 ? nickname : '닉네임 없음';

  const handleResetData = () => {
    Alert.alert('데이터 초기화', '기기에 저장된 임시 정보와 로그인 세션을 지울까요?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '초기화',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearSession();
            router.replace('/register/ticket');
          } catch (error) {
            console.error('세션 초기화 실패:', error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MY</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MySection title="내 정보" style={{ marginTop: 8 }}>
          <MyProfileCard
            nickname={displayNickname}
            onEditPress={() => {
              // later: nickname edit screen or modal
            }}
          />
        </MySection>

        <MySection title="이용 관리">
          <MyActionItem
            iconName="qr-code-outline"
            label="티켓 다시 스캔"
            helperText="행사 참여 정보를 다시 불러와요"
            onPress={() => {
              router.replace('/register/ticket');
            }}
          />
        </MySection>

        <MySection title="기타">
          <MyActionItem
            iconName="swap-horizontal-outline"
            label="행사 변경"
            helperText="다른 행사 화면으로 이동해요"
            onPress={() => {
              // later: event select
            }}
          />

          <MyActionItem
            iconName="refresh-outline"
            label="데이터 초기화"
            helperText="기기에 저장된 임시 정보를 지워요"
            tone="danger"
            onPress={handleResetData}
          />
        </MySection>
      </ScrollView>

      <BottomTabBar
        activeTab="my"
        onTabPress={(tab) => router.replace(TAB_ROUTES[tab])}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 130,
  },
});
