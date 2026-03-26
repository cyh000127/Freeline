import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { TAB_ROUTES } from '@/constants/tabRoutes';
import MySection from '@/components/my/MySection';
import MyProfileCard from '@/components/my/MyProfileCard';
import MyActionItem from '@/components/my/MyActionItem';
import { useAuthSession } from '@/features/auth/auth-session.context';
import NicknameEditModal from '@/components/my/NicknameEditModal';

export default function My() {
  const router = useRouter();
  const [isNicknameModalVisible, setNicknameModalVisible] = useState(false);
  const { nickname, setNickname, clearSession, reloadSession } = useAuthSession();

  const displayNickname =
    typeof nickname === 'string' && nickname.trim().length > 0 ? nickname : '닉네임 없음';

  const handleResetData = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('기기에 저장된 임시 정보와 로그인 세션을 지울까요?');
      if (confirmed) {
        clearSession().catch((error) => console.error('세션 초기화 실패:', error));
      }
      return;
    }

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
            onEditPress={() => setNicknameModalVisible(true)}
          />
        </MySection>

        <MySection title="이용 관리">
          <MyActionItem
            iconName="qr-code-outline"
            label="티켓 재스캔"
            helperText="행사 참여 정보를 다시 불러올 수 있습니다."
            onPress={async () => {
              try {
                await reloadSession();
                Alert.alert('완료', '행사 참여 정보를 갱신했습니다.');
              } catch {
                Alert.alert('오류', '정보를 불러오는데 실패했습니다.');
              }
            }}
          />
        </MySection>

        <MySection title="기타">

          <MyActionItem
            iconName="refresh-outline"
            label="데이터 초기화"
            helperText="기기에 저장된 임시 정보를 삭제합니다."
            tone="danger"
            onPress={handleResetData}
          />
        </MySection>
      </ScrollView>

      <BottomTabBar
        activeTab="my"
        onTabPress={(tab) => router.replace(TAB_ROUTES[tab])}
      />

      <NicknameEditModal
        visible={isNicknameModalVisible}
        initialNickname={nickname ?? ''}
        onClose={() => setNicknameModalVisible(false)}
        onSave={(newNickname) => {
          setNickname(newNickname);
        }}
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
