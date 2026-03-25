import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ReservationFlowScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#111111" />
        </Pressable>

        <Text style={styles.title}>예약하기</Text>
        <View style={styles.headerDivider} />
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>예약 내역</Text>

          <Text style={styles.boothName}>포스코 DX</Text>
          <Text style={styles.boothLocation}>부스 위치: 2층 The Platz P300</Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>실시간 대기 현황</Text>

          <View style={styles.statusCard}>
            <View style={styles.statusBlock}>
              <Text style={styles.statusLabel}>현재 대기 인원</Text>
              <Text style={styles.statusValue}>130명</Text>
            </View>

            <View style={styles.statusBlock}>
              <Text style={styles.statusLabel}>예상 대기 시간</Text>
              <Text style={styles.statusValue}>107분</Text>
            </View>
          </View>

          <Text style={styles.noticeText}>
            * 대기 시간은 현장 상황에 따라 유동적으로 변경될 수 있습니다.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>예약자 정보 확인</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>예약자</Text>
            <Text style={styles.infoValue}>청하한 두루미</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>참여 일자</Text>
            <Text style={styles.infoValue}>2026.03.06(목)</Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>대기 및 이용 안내사항</Text>

          <View style={styles.guideHeaderRow}>
            <Ionicons name="information-circle-outline" size={18} color="#111111" />
            <Text style={styles.guideHeaderText}>예약 신청 전 반드시 확인해주세요!</Text>
          </View>

          <View style={styles.guideList}>
            <Text style={styles.guideItem}>
              · 내 순서가 다가오면 <Text style={styles.bold}>앱 푸시 및 알림톡</Text>
              으로 안내해 드립니다.
            </Text>
            <Text style={styles.guideItem}>
              · 입장 호출 알림 수신 후 <Text style={styles.bold}>5분 이내</Text>에 부스
              입구로 와주세요.
            </Text>
            <Text style={styles.guideItem}>
              · 시간 내 미입장 시 <Text style={styles.bold}>대기 예약이 자동 취소</Text>{' '}
              처리됩니다.
            </Text>
            <Text style={styles.guideItem}>
              · 보다 많은 관람객의 체험을 위해 동시 대기 가능한 부스 개수는{' '}
              <Text style={styles.bold}>최대 3개</Text>로 제한됩니다.
            </Text>
          </View>

          <Pressable
            style={styles.checkboxRow}
            onPress={() => setAgreed((prev) => !prev)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
            </View>
            <Text style={styles.checkboxText}>
              [필수] 위 안내사항을 모두 확인하였음에 동의합니다.
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <Pressable
          style={[styles.submitButton, !agreed && styles.submitButtonDisabled]}
          disabled={!agreed}
          onPress={() => router.push('/reservation_flow/complete')}
        >
          <Text style={styles.submitButtonText}>예약하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 140,
  },

  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    marginBottom: 8,
    marginLeft: -6,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 14,
  },

  section: {
    marginBottom: 18,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 14,
  },

  headerDivider: {
    height: 1,
    backgroundColor: '#E3E4E8',
    marginBottom: 18,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: '#E3E4E8',
    marginBottom: 18,
  },

  boothName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 10,
  },

  boothLocation: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    lineHeight: 24,
  },

  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#EAEBEE',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginTop: 6,
  },

  statusBlock: {
    flex: 1,
    alignItems: 'center',
  },

  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
  },

  statusValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
  },

  noticeText: {
    marginTop: 16,
    fontSize: 13,
    fontWeight: '500',
    color: '#444444',
    lineHeight: 20,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },

  infoValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
  },

  guideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  guideHeaderText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },

  guideList: {
    marginBottom: 18,
  },

  guideItem: {
    fontSize: 14,
    fontWeight: '500',
    color: '#222222',
    lineHeight: 24,
  },

  bold: {
    fontWeight: '800',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 6,
    paddingHorizontal: 6,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: '#444444',
    borderRadius: 3,
    marginTop: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  checkboxChecked: {
    backgroundColor: '#34314C',
    borderColor: '#34314C',
  },

  checkboxText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    lineHeight: 20,
  },

  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: '#F7F7F8',
  },

  submitButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#34314C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: '#C8C9CF',
  },

  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
