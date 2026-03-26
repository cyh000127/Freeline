import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import RegisterScreenLayout from '@/components/register/RegisterScreenLayout';
import RegisterCheckboxRow from '@/components/register/RegisterCheckboxRow';
import { useAuthSession } from '@/features/auth/auth-session.context';
import { getEventDetail } from '@/features/event/event.api';
import type { EventDetail } from '@/features/event/types';

export default function ConfirmScreen() {
  const router = useRouter();

  const [requiredAgreed, setRequiredAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const { accessToken, eventId, nickname, completeRegistration, isHydrating } = useAuthSession();

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!accessToken) {
      router.replace('/register/ticket');
      return;
    }

    if (!nickname) {
      router.replace('/register/nickname');
      return;
    }

    // Fetch event detail
    const fetchEvent = async () => {
      try {
        setLoadingEvent(true);
        const data = await getEventDetail(accessToken, eventId ?? 1);
        setEventDetail(data);
      } catch (err) {
        console.error('Failed to fetch event details:', err);
      } finally {
        setLoadingEvent(false);
      }
    };

    fetchEvent();
  }, [accessToken, eventId, nickname, isHydrating, router]);

  const displayNickname =
    typeof nickname === 'string' && nickname.trim().length > 0 ? nickname : '닉네임 없음';

  const handleStart = () => {
    if (!requiredAgreed) {
      return;
    }

    completeRegistration({
      requiredAgreed,
      marketingAgreed,
    });

    router.replace('/home');
  };

  return (
    <RegisterScreenLayout>
      <Text style={styles.title}>예매하신 티켓 정보가 맞으신가요?</Text>

      <View style={styles.infoWrap}>
        <View style={styles.row}>
          <Text style={styles.label}>박람회</Text>
          <Text style={styles.value}>
            {loadingEvent ? '불러오는 중...' : eventDetail?.name ?? '행사 정보 없음'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>닉네임</Text>
          <Text style={styles.value}>{displayNickname}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>기간</Text>
          <Text style={styles.value}>
            {loadingEvent 
              ? '불러오는 중...' 
              : (eventDetail 
                  ? `${eventDetail.startDate.replace(/-/g, '.')} - ${eventDetail.endDate.replace(/-/g, '.')}` 
                  : '-')}
          </Text>
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
        onPress={handleStart}
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
