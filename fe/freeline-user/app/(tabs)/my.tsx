import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { TextField } from '@/components/TextField';
import { useAppData } from '@/features/app-data/context';
import { useSession } from '@/features/session/context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';

export default function MyScreen() {
  usePageTracking('my');
  const session = useSession();
  const { queueStatus, waitings } = useAppData();
  const [nickname, setNickname] = useState(session.nickname);

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SectionTitle caption="환경설정과 개인 상태를 관리하세요" title="MY" />

          <View style={styles.profileCard}>
            <Text style={styles.profileTitle}>{session.nickname || '방문객'}</Text>
            <Text style={styles.profileMeta}>Entry Code {session.entryCode}</Text>
            <Text style={styles.profileMeta}>현재 상태 {queueStatus}</Text>
            <Text style={styles.profileMeta}>활성 예약 {waitings.length}건</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>닉네임 수정</Text>
            <TextField onChangeText={setNickname} placeholder="닉네임" value={nickname} />
            <ActionButton
              label="닉네임 저장"
              onPress={() => {
                void session.saveNickname(nickname);
              }}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>설정</Text>
            <ActionButton
              label={session.marketingAgreed ? '마케팅 수신 동의됨' : '마케팅 수신 미동의'}
              onPress={() => {
                void session.saveAgreements(session.requiredAgreed, !session.marketingAgreed);
              }}
              variant="ghost"
            />
            <ActionButton
              label="로그아웃"
              onPress={() => {
                void session.logout();
              }}
              variant="ghost"
            />
            <ActionButton
              label="세션 초기화"
              onPress={() => {
                void session.resetAll();
              }}
              variant="ghost"
            />
          </View>
        </ScrollView>

        <FloatingTabBar />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 20,
    paddingBottom: 148,
  },
  profileCard: {
    backgroundColor: palette.ink,
    borderRadius: 28,
    padding: 22,
    gap: 8,
  },
  profileTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  profileMeta: {
    color: '#D6D4E6',
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.text,
  },
});
