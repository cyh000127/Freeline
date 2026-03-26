import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthSession } from '@/features/auth/auth-session.context';
import { getBoothDetail, getBoothGoods } from '@/features/booth/booth.api';
import { getExpectedWaitingTime, createWaiting } from '@/features/waiting/waiting.api';
import type { BoothDetailData, BoothGoodsItem } from '@/features/booth/types';
import type { WaitingExpectedTimeData } from '@/features/waiting/types';

function getDisplayImage(booth: BoothDetailData) {
  return booth.representativeImageUrl ?? booth.boothImageUrls[0] ?? null;
}

export default function ReservationFlowDetailScreen() {
  const router = useRouter();
  const { boothId } = useLocalSearchParams<{ boothId: string }>();
  const { accessToken, nickname } = useAuthSession();

  const [booth, setBooth] = useState<BoothDetailData | null>(null);
  const [goods, setGoods] = useState<BoothGoodsItem[]>([]);
  const [waitStatus, setWaitStatus] = useState<WaitingExpectedTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!accessToken || !boothId) {
        return;
      }

      try {
        setLoading(true);
        const numericBoothId = Number(boothId);
        const [boothData, waitData, goodsData] = await Promise.all([
          getBoothDetail(accessToken, numericBoothId),
          getExpectedWaitingTime(accessToken, numericBoothId),
          getBoothGoods(accessToken, numericBoothId),
        ]);
        setBooth(boothData);
        setWaitStatus(waitData);
        setGoods(goodsData);
      } catch (error) {
        console.error('부스 상세 로드 실패:', error);
        Alert.alert('오류', '부스 정보를 불러오지 못했습니다.');
        router.back();
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [accessToken, boothId, router]);

  const handleSubmit = async () => {
    if (!accessToken || !boothId) {
      return;
    }

    try {
      setSubmitting(true);
      await createWaiting(accessToken, Number(boothId));
      router.replace({
        pathname: '/reservation_flow/complete',
        params: { boothName: booth?.name },
      });
    } catch (error) {
      console.error('예약 생성 실패:', error);
      const message = error instanceof Error ? error.message : '예약에 실패했습니다.';
      Alert.alert('예약 오류', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !booth || !waitStatus) {
    return (
      <View style={[styles.screen, styles.centerBox]}>
        <ActivityIndicator size="large" color="#34314C" />
      </View>
    );
  }

  const boothImage = getDisplayImage(booth);

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

          {boothImage ? (
            <Image source={{ uri: boothImage }} style={styles.boothImage} resizeMode="cover" />
          ) : null}

          <Text style={styles.boothName}>{booth.name}</Text>
          <Text style={styles.boothLocation}>부스 위치: {booth.locationCode}</Text>
          <Text style={styles.boothMeta}>
            현재 대기 {booth.waitingCount}팀, 호출 가능 {booth.callCount}팀
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>실시간 대기 현황</Text>

          <View style={styles.statusCard}>
            <View style={styles.statusBlock}>
              <Text style={styles.statusLabel}>현재 대기 팀</Text>
              <Text style={styles.statusValue}>{waitStatus.current_rank}팀</Text>
            </View>

            <View style={styles.statusBlock}>
              <Text style={styles.statusLabel}>예상 대기 시간</Text>
              <Text style={styles.statusValue}>{waitStatus.estimated_minutes}분</Text>
            </View>
          </View>

          <Text style={styles.noticeText}>
            평균 체류 시간은 약 {waitStatus.avg_stay_time}분이며, 현장 상황에 따라 변경될 수
            있습니다.
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>굿즈 목록</Text>

          {goods.length === 0 ? (
            <Text style={styles.emptyText}>등록된 굿즈가 없습니다.</Text>
          ) : (
            <View style={styles.goodsList}>
              {goods.map((item) => (
                <View key={item.goodsId} style={styles.goodsCard}>
                  <Text style={styles.goodsName}>{item.name}</Text>
                  <Text style={item.isSoldOut ? styles.goodsSoldOut : styles.goodsAvailable}>
                    {item.isSoldOut ? '품절' : '구매 가능'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>예약자 정보 확인</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>예약자</Text>
            <Text style={styles.infoValue}>{nickname || '관람객'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>참여 일자</Text>
            <Text style={styles.infoValue}>당일 현장 예약</Text>
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
              · 내 순서가 다가오면 <Text style={styles.bold}>앱 푸시</Text>로 안내해 드립니다.
            </Text>
            <Text style={styles.guideItem}>
              · 입장 호출 알림 수신 후 <Text style={styles.bold}>5분 이내</Text>에 부스 입구로
              와주세요.
            </Text>
            <Text style={styles.guideItem}>
              · 시간 내 미입장 시 <Text style={styles.bold}>대기 예약이 자동 취소</Text>
              처리됩니다.
            </Text>
            <Text style={styles.guideItem}>
              · 동시 대기 가능한 부스 개수는 <Text style={styles.bold}>최대 3개</Text>입니다.
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
          style={[styles.submitButton, (!agreed || submitting) && styles.submitButtonDisabled]}
          disabled={!agreed || submitting || booth.isEmergencyClosed}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {booth.isEmergencyClosed
              ? '현재 긴급 마감된 부스입니다'
              : submitting
                ? '예약 처리 중...'
                : '예약하기'}
          </Text>
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
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
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
  boothImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
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
  boothMeta: {
    marginTop: 8,
    fontSize: 14,
    color: '#555555',
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
  emptyText: {
    fontSize: 14,
    color: '#777777',
  },
  goodsList: {
    gap: 10,
  },
  goodsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goodsName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  goodsAvailable: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00A66C',
  },
  goodsSoldOut: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5484D',
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
    backgroundColor: '#F0F2F5',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
