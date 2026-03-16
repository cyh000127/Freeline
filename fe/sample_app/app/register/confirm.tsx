import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import RegisterScreenLayout from '@/components/register/RegisterScreenLayout';
import RegisterCheckboxRow from '@/components/register/RegisterCheckboxRow';

export default function ConfirmScreen() {
  const router = useRouter();
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();

  const [requiredAgreed, setRequiredAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  const displayNickname =
    typeof nickname === 'string' && nickname.trim().length > 0 ? nickname : '닉네임 없음';

  return (
    <RegisterScreenLayout>
      <Text style={styles.title}>예매하신 티켓 정보가 맞으신가요?</Text>

      <View style={styles.infoWrap}>
        <View style={styles.row}>
          <Text style={styles.label}>박람회</Text>
          <Text style={styles.value}>AW 2026 스마트 제조혁신 산업전</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>닉네임</Text>
          <Text style={styles.value}>{displayNickname}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>기간</Text>
          <Text style={styles.value}>26.03.06 - 26.03.08</Text>
        </View>
      </View>

      <View style={styles.checkboxGroup}>
        <RegisterCheckboxRow
          value={requiredAgreed}
          onChange={setRequiredAgreed}
          label="[필수] 서비스 이용약관 및 개인정보 수집 동의"
        />
        <RegisterCheckboxRow
          value={marketingAgreed}
          onChange={setMarketingAgreed}
          label="[선택] 이벤트 및 마케팅 알림 수신 동의"
        />
      </View>

      <Pressable
        style={[styles.button, !requiredAgreed && styles.buttonDisabled]}
        disabled={!requiredAgreed}
        onPress={() => router.replace('/home')}
      >
        <Text style={styles.buttonText}>이 정보로 시작하기</Text>
      </Pressable>
    </RegisterScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Pretendard',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 18,
  },
  infoWrap: {
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  label: {
    width: 68,
    fontFamily: 'Pretendard',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '800',
    color: '#111111',
  },
  value: {
    flex: 1,
    fontFamily: 'Pretendard',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
    color: '#676781',
  },
  checkboxGroup: {
    marginBottom: 30,
  },
  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#302C55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontFamily: 'Pretendard',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
