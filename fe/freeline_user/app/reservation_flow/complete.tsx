import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ReservationComplete() {
  const router = useRouter();
  const { boothName } = useLocalSearchParams<{ boothName?: string }>();

  return (
    <View style={styles.screen}>
      {/* Top section */}
      <View style={styles.topArea}>
        <Text style={styles.title}>
          {boothName ? `'${boothName}' 예약이 완료되었습니다!` : '예약이 완료되었습니다!'}
        </Text>

        <View style={styles.iconWrapper}>
          <Ionicons name="checkmark" size={32} color="#1BA672" />
        </View>
      </View>

      {/* Info block */}
      <View style={styles.infoBlock}>
        <Text style={styles.infoTitle}>꼭 알아두세요!</Text>

        <Text style={styles.infoText}>
          · 내 순서가 다가오면 <Text style={styles.bold}>앱 푸시 및 알림톡</Text>으로
          안내해 드립니다.
        </Text>
        <Text style={styles.infoText}>
          · 입장 호출 알림 수신 후 <Text style={styles.bold}>5분 이내</Text>에 부스 입구로
          와주세요.
        </Text>
        <Text style={styles.infoText}>
          · 시간 내 미입장 시 <Text style={styles.bold}>대기 예약이 자동 취소</Text>{' '}
          처리됩니다.
        </Text>
        <Text style={styles.infoText}>
          · 보다 많은 관람객의 체험을 위해 동시 대기 가능한 부스 개수는{' '}
          <Text style={styles.bold}>최대 3개</Text>로 제한됩니다.
        </Text>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomArea}>
        <Pressable style={styles.button} onPress={() => router.replace('/reservation')}>
          <Text style={styles.buttonText}>예약 내역 조회</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },

  topArea: {
    alignItems: 'center',
    marginTop: 120,
    marginBottom: 40,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 32,
  },

  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#1BA672',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoBlock: {
    backgroundColor: '#E5E6EA',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111111',
  },

  infoText: {
    fontSize: 14,
    color: '#222222',
    lineHeight: 22,
    marginBottom: 4,
  },

  bold: {
    fontWeight: '800',
  },

  bottomArea: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 20,
  },

  button: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#34314C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
