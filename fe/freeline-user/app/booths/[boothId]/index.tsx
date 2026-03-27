import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ActionButton } from '@/components/ActionButton';
import { AppImage } from '@/components/AppImage';
import { BottomActionBar } from '@/components/BottomActionBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ReservationConfirmSheet } from '@/components/ReservationConfirmSheet';
import { Screen } from '@/components/Screen';
import { type BoothDetail } from '@/features/api/booths';
import { WAITING_LIMIT_MESSAGE } from '@/features/app-data/constants';
import { useAppData } from '@/features/app-data/context';
import { useToast } from '@/features/toast/context';
import { useTracking } from '@/features/tracking/tracking.context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';
import { toUserErrorMessage } from '@/utils/error';
import { formatWaitingStatus } from '@/utils/format';

export default function BoothDetailScreen() {
  usePageTracking('booth-detail');
  const params = useLocalSearchParams<{ boothId: string }>();
  const boothId = Number(params.boothId);
  const {
    boothDetails,
    cancelWaiting,
    createWaiting,
    findWaitingByBoothId,
    getBoothDetail,
    postponeWaiting,
  } = useAppData();
  const { trackEvent } = useTracking();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<BoothDetail | null>(boothDetails[boothId] ?? null);
  const [loading, setLoading] = useState(!detail);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmingReserve, setConfirmingReserve] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [limitVisible, setLimitVisible] = useState(false);
  const [registerErrorMessage, setRegisterErrorMessage] = useState<string | null>(null);
  const [registerErrorPending, setRegisterErrorPending] = useState<string | null>(null);

  useEffect(() => {
    if (!registerErrorPending || confirmVisible) {
      return;
    }

    const timeout = setTimeout(() => {
      if (registerErrorPending.includes(WAITING_LIMIT_MESSAGE)) {
        setLimitVisible(true);
      } else {
        setRegisterErrorMessage(registerErrorPending);
      }
      setRegisterErrorPending(null);
    }, 260);

    return () => {
      clearTimeout(timeout);
    };
  }, [confirmVisible, registerErrorPending]);

  function openRegisterErrorDialog(message: string) {
    setRegisterErrorMessage(null);
    setLimitVisible(false);
    setRegisterErrorPending(message);
    setConfirmVisible(false);
  }

  useEffect(() => {
    const latest = boothDetails[boothId];
    if (latest) {
      setDetail(latest);
      setLoading(false);
    }
  }, [boothDetails, boothId]);

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

  const activeWaiting = Number.isFinite(boothId) ? findWaitingByBoothId(boothId) : null;

  async function handleReserve() {
    if (!detail) {
      return;
    }

    try {
      setConfirmingReserve(true);
      await createWaiting(detail.boothId);
      setConfirmVisible(false);
      showToast({ type: 'success', message: '대기 신청이 완료되었습니다.' });
    } catch (error) {
      const message = toUserErrorMessage(error, '대기 등록에 실패했습니다.');
      openRegisterErrorDialog(message);
    } finally {
      setConfirmingReserve(false);
    }
  }

  async function handleCancel() {
    if (!activeWaiting) {
      return;
    }

    try {
      setCanceling(true);
      await cancelWaiting(activeWaiting);
      setCancelVisible(false);
      showToast({ type: 'success', message: '예약이 취소되었습니다.' });
    } catch (error) {
      showToast({
        type: 'error',
        message: toUserErrorMessage(error, '예약 취소에 실패했습니다.'),
      });
    } finally {
      setCanceling(false);
    }
  }

  async function handlePostpone() {
    if (!activeWaiting) {
      return;
    }

    try {
      await postponeWaiting(activeWaiting);
      showToast({ type: 'success', message: '순서를 뒤로 미뤘습니다.' });
    } catch (error) {
      showToast({
        type: 'error',
        message: toUserErrorMessage(error, '순서 미루기에 실패했습니다.'),
      });
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

              <View style={styles.headerBlock}>
                <Text style={styles.code}>{detail.locationCode}</Text>
                <Text style={styles.name}>{detail.name}</Text>
                <Text style={styles.meta}>운영 중인 부스 상세 정보와 예약 상태를 확인하세요.</Text>
              </View>

              <View style={styles.queueHero}>
                <View style={styles.queueHeroMain}>
                  <Text style={styles.queueLabel}>현재 대기 인원</Text>
                  <Text style={styles.queueValue}>{detail.waitingCount}</Text>
                  <Text style={styles.queueSub}>호출 인원 {detail.callCount}명 동시 진행</Text>
                </View>
                <View style={styles.queueHeroSide}>
                  <InfoChip
                    label="상태"
                    value={
                      activeWaiting ? `내 예약 ${formatWaitingStatus(activeWaiting.status)}` : '운영 중'
                    }
                  />
                  <InfoChip label="호출 유효 시간" value={`${detail.callValidSeconds}초`} />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>부스 소개</Text>
                <Text style={styles.bodyText}>
                  {`${detail.locationCode} 구역에서 운영 중인 ${detail.name} 부스입니다. 현재 대기 현황과 굿즈 상태를 확인하고 예약 상태를 바로 관리할 수 있습니다.`}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>운영 정보</Text>
                <InfoRow label="위치" value={detail.locationCode} />
                <InfoRow label="호출 인원" value={`${detail.callCount}명`} />
                <InfoRow label="호출 유효 시간" value={`${detail.callValidSeconds}초`} />
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
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
                {activeWaiting?.status === 'WAITING' && activeWaiting.postpone_available ? (
                  <ActionButton
                    grow
                    label="순서 미루기"
                    onPress={() => void handlePostpone()}
                    variant="ghost"
                  />
                ) : null}
                {activeWaiting ? (
                  <ActionButton
                    grow
                    label="예약 취소하기"
                    onPress={() => setCancelVisible(true)}
                    variant="secondary"
                  />
                ) : (
                  <ActionButton
                    disabled={detail.isEmergencyClosed}
                    grow
                    label={detail.isEmergencyClosed ? '현재 예약 불가' : '부스 대기 등록'}
                    onPress={() => setConfirmVisible(true)}
                    variant="secondary"
                  />
                )}
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

            <ConfirmDialog
              body={`${detail.name} 예약을 취소할까요? 취소 후에는 다시 대기를 등록해야 합니다.`}
              confirmLabel="예약 취소하기"
              confirming={canceling}
              onClose={() => setCancelVisible(false)}
              onConfirm={() => {
                void handleCancel();
              }}
              title="예약을 취소할까요?"
              visible={cancelVisible && !!activeWaiting}
            />

            <ConfirmDialog
              body={WAITING_LIMIT_MESSAGE}
              confirmLabel="확인"
              hideCancel
              onClose={() => setLimitVisible(false)}
              onConfirm={() => setLimitVisible(false)}
              title="대기 등록 제한"
              visible={limitVisible}
            />

            <ConfirmDialog
              body={registerErrorMessage ?? ''}
              confirmLabel="확인"
              hideCancel
              onClose={() => setRegisterErrorMessage(null)}
              onConfirm={() => setRegisterErrorMessage(null)}
              title="대기 등록 실패"
              visible={!!registerErrorMessage}
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
  headerBlock: {
    marginTop: 6,
    marginHorizontal: 20,
    gap: 6,
  },
  code: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.text,
  },
  meta: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  queueHero: {
    marginHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
  },
  queueHeroMain: {
    flex: 1.2,
    backgroundColor: palette.ink,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: 156,
    justifyContent: 'space-between',
  },
  queueHeroSide: {
    flex: 1,
    gap: 10,
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
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 20,
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.text,
  },
  bodyText: {
    color: palette.text,
    lineHeight: 22,
  },
  sectionHeader: {
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
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  chipLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chipValue: {
    color: palette.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
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

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}
