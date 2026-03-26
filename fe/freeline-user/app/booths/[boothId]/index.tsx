import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ActionButton } from '@/components/ActionButton';
import { AppImage } from '@/components/AppImage';
import { BottomActionBar } from '@/components/BottomActionBar';
import { EmptyState } from '@/components/EmptyState';
import { ReservationConfirmSheet } from '@/components/ReservationConfirmSheet';
import { Screen } from '@/components/Screen';
import { type BoothDetail } from '@/features/api/booths';
import { useAppData } from '@/features/app-data/context';
import { useTracking } from '@/features/tracking/tracking.context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';

export default function BoothDetailScreen() {
  usePageTracking('booth-detail');
  const params = useLocalSearchParams<{ boothId: string }>();
  const boothId = Number(params.boothId);
  const { boothDetails, createWaiting, getBoothDetail } = useAppData();
  const { trackEvent } = useTracking();
  const [detail, setDetail] = useState<BoothDetail | null>(boothDetails[boothId] ?? null);
  const [loading, setLoading] = useState(!detail);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmingReserve, setConfirmingReserve] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(boothId) || detail) {
      return;
    }

    async function load() {
      try {
        const result = await getBoothDetail(boothId);
        setDetail(result);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [boothId, detail, getBoothDetail]);

  async function handleReserve() {
    if (!detail) {
      return;
    }

    try {
      setConfirmingReserve(true);
      await createWaiting(detail.boothId);
      setConfirmVisible(false);
    } finally {
      setConfirmingReserve(false);
    }
  }

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.flex}>
        {loading ? <Text style={styles.loading}>불러오는 중...</Text> : null}
        {!loading && !detail ? (
          <View style={styles.emptyWrap}>
            <EmptyState caption="부스 정보를 가져오지 못했습니다." title="조회 실패" />
          </View>
        ) : null}

        {detail ? (
          <>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.hero}>
                <AppImage
                  fallback={
                    <View style={styles.heroFallback}>
                      <Text style={styles.heroFallbackText}>{detail.name}</Text>
                    </View>
                  }
                  source={detail.representativeImageUrl}
                  style={styles.heroImage}
                />
                <Pressable onPress={() => router.back()} style={styles.closeButton}>
                  <Feather color={palette.ink} name="x" size={20} />
                </Pressable>
              </View>

              <View style={styles.headerCard}>
                <Text style={styles.code}>{detail.locationCode}</Text>
                <Text style={styles.name}>{detail.name}</Text>
                <Text style={styles.meta}>운영 중인 부스 상세 정보와 예약 상태를 확인하세요.</Text>
              </View>

              <View style={styles.queueHero}>
                <Text style={styles.queueLabel}>현재 대기 인원</Text>
                <Text style={styles.queueValue}>{detail.waitingCount}</Text>
                <Text style={styles.queueSub}>호출 인원 {detail.callCount}명 동시 진행</Text>
              </View>

              <View style={styles.infoCard}>
                <InfoRow label="위치" value={detail.locationCode} />
                <InfoRow label="호출 인원" value={`${detail.callCount}명`} />
                <InfoRow label="호출 유효 시간" value={`${detail.callValidSeconds}초`} />
              </View>

              <View style={styles.goodsCard}>
                <View style={styles.goodsHeader}>
                  <View style={styles.goodsHeaderCopy}>
                    <Text style={styles.goodsTitle}>굿즈 목록</Text>
                    <Text style={styles.goodsBody}>
                      {detail.goods.length
                        ? `${detail.goods.length}종의 굿즈가 준비되어 있습니다.`
                        : '등록된 굿즈가 없습니다.'}
                    </Text>
                  </View>
                  <ActionButton
                    label="굿즈 목록 보기"
                    onPress={() => {
                      trackEvent({
                        action: 'GOODS_VIEW',
                        targetType: 'GOODS',
                        targetId: String(detail.boothId),
                        metadata: {
                          source: 'booth-detail',
                          booth_name: detail.name,
                          goods_count: detail.goods.length,
                        },
                      });
                      router.push(`/booths/${detail.boothId}/goods`);
                    }}
                    variant="ghost"
                  />
                </View>
              </View>
            </ScrollView>

            <BottomActionBar>
              <View style={styles.bottomActions}>
                <ActionButton grow label="뒤로가기" onPress={() => router.back()} variant="ghost" />
                <ActionButton
                  disabled={detail.isEmergencyClosed}
                  grow
                  label={detail.isEmergencyClosed ? '현재 예약 불가' : '부스 대기 등록'}
                  onPress={() => setConfirmVisible(true)}
                  variant="secondary"
                />
              </View>
            </BottomActionBar>

            <ReservationConfirmSheet
              boothName={detail.name}
              confirming={confirmingReserve}
              locationCode={detail.locationCode}
              onClose={() => setConfirmVisible(false)}
              onConfirm={() => {
                void handleReserve();
              }}
              visible={confirmVisible}
              waitingCount={detail.waitingCount}
            />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    paddingHorizontal: 20,
    paddingTop: 20,
    color: palette.textMuted,
  },
  emptyWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  content: {
    gap: 18,
    paddingBottom: 118,
  },
  hero: {
    height: 280,
    overflow: 'hidden',
    backgroundColor: palette.surfaceAlt,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.ink,
    paddingHorizontal: 24,
  },
  heroFallbackText: {
    color: '#FFFFFF',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '800',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  headerCard: {
    marginTop: -26,
    marginHorizontal: 20,
    backgroundColor: palette.background,
    borderRadius: 28,
    padding: 20,
    gap: 6,
  },
  code: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  name: {
    marginHorizontal: 20,
    fontSize: 28,
    fontWeight: '800',
    color: palette.text,
  },
  meta: {
    marginHorizontal: 20,
    color: palette.textMuted,
    lineHeight: 21,
  },
  queueHero: {
    marginHorizontal: 20,
    backgroundColor: palette.ink,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 4,
  },
  queueLabel: {
    color: '#D6D4E6',
    fontSize: 12,
    fontWeight: '800',
  },
  queueValue: {
    color: '#FFFFFF',
    fontSize: 54,
    lineHeight: 60,
    fontWeight: '900',
  },
  queueSub: {
    color: '#D6D4E6',
  },
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  goodsCard: {
    marginHorizontal: 20,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  goodsHeader: {
    gap: 12,
  },
  goodsHeaderCopy: {
    gap: 6,
  },
  goodsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  goodsBody: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  goodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goodsName: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
  },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.goodsRow}>
      <Text style={styles.goodsName}>{label}</Text>
      <Text style={styles.meta}>{value}</Text>
    </View>
  );
}
