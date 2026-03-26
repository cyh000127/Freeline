import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type BoothDetail, type BoothSummary } from '@/features/api/booths';
import { palette } from '@/theme/colors';
import { ActionButton } from './ActionButton';

type Props = {
  booth: BoothSummary | null;
  detail: BoothDetail | null;
  estimatedMinutes?: number | null;
  loading?: boolean;
  visible: boolean;
  onClose: () => void;
  onExpandToggle: () => void;
  expanded: boolean;
  onReserve: () => void;
};

const screenHeight = Dimensions.get('window').height;

export function BoothBottomSheet({
  booth,
  detail,
  estimatedMinutes = null,
  loading = false,
  visible,
  onClose,
  onExpandToggle,
  expanded,
  onReserve,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const [mounted, setMounted] = useState(visible);

  const targetHeight = expanded ? screenHeight - insets.top : Math.min(screenHeight * 0.62, 600);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 140,
        mass: 0.9,
      }).start();
      return;
    }

    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [translateY, visible]);

  const intro = useMemo(() => {
    if (!booth) {
      return '';
    }

    return `${booth.locationCode} 구역에서 운영 중인 ${booth.name} 부스입니다. 현재 대기 현황과 굿즈 상태를 확인하고 바로 예약할 수 있습니다.`;
  }, [booth]);

  if (!mounted || !booth) {
    return null;
  }

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible>
      <View style={styles.modalRoot}>
        <Pressable onPress={onClose} style={styles.backdrop} />

        <Animated.View
          style={[
            styles.sheet,
            {
              height: targetHeight,
              paddingTop: expanded ? insets.top + 2 : 10,
              paddingBottom: Math.max(insets.bottom, 18),
              transform: [{ translateY }],
            },
          ]}
        >
          <Pressable onPress={onExpandToggle} style={styles.handleArea}>
            <View style={styles.handle} />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.headerMain}>
              <Text style={styles.code}>{booth.locationCode}</Text>
              <Text style={styles.title}>{booth.name}</Text>
              <Text style={styles.meta}>
                운영시간 {booth.openTime} - {booth.closeTime}
              </Text>
            </View>

            <Pressable onPress={expanded ? onClose : onExpandToggle} style={styles.closeButton}>
              <Feather color={palette.ink} name={expanded ? 'x' : 'maximize-2'} size={18} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              {detail?.representativeImageUrl ? (
                <Image contentFit="cover" source={detail.representativeImageUrl} style={styles.heroImage} />
              ) : (
                <View style={styles.heroFallback}>
                  <Text style={styles.heroFallbackText}>{booth.name}</Text>
                </View>
              )}
            </View>

            <View style={styles.queueHero}>
              <View style={styles.queueHeroMain}>
                <Text style={styles.queueHeroLabel}>현재 대기 인원</Text>
                <Text style={styles.queueHeroValue}>{detail?.waitingCount ?? '-'}</Text>
                <Text style={styles.queueHeroSub}>
                  {estimatedMinutes ? `예상 대기 약 ${estimatedMinutes}분` : '예상 대기 시간 확인 전'}
                </Text>
              </View>
              <View style={styles.queueHeroSide}>
                <InfoChip label="상태" value={booth.isEmergencyClosed ? '긴급 마감' : '운영 중'} />
                <InfoChip label="호출 인원" value={detail ? `${detail.callCount}명` : '확인 중'} />
              </View>
            </View>

            <SectionBlock title="부스 소개">
              <Text style={styles.bodyText}>{intro}</Text>
            </SectionBlock>

            <SectionBlock title="운영 정보">
              <View style={styles.infoList}>
                <InfoRow icon="map-pin" label="위치" value={booth.locationCode} />
                <InfoRow icon="clock" label="운영시간" value={`${booth.openTime} - ${booth.closeTime}`} />
                <InfoRow
                  icon="users"
                  label="호출 인원"
                  value={detail ? `${detail.callCount}명 동시 호출` : '확인 중'}
                />
              </View>
            </SectionBlock>

            <SectionBlock title="굿즈 안내">
              <View style={styles.goodsSummaryCard}>
                <View style={styles.goodsSummaryCopy}>
                  <Text style={styles.goodsSummaryTitle}>굿즈 목록</Text>
                  <Text style={styles.goodsSummaryBody}>
                    {loading
                      ? '부스 정보를 불러오는 중입니다.'
                      : detail?.goods.length
                        ? `${detail.goods.length}종의 굿즈를 확인할 수 있습니다.`
                        : '현재 등록된 굿즈가 없습니다.'}
                  </Text>
                </View>
                <ActionButton
                  label="굿즈 목록 보기"
                  onPress={() => {
                    onClose();
                    router.push(`/booths/${booth.boothId}/goods`);
                  }}
                  variant="ghost"
                />
              </View>
            </SectionBlock>
          </ScrollView>

          <View style={styles.footer}>
            <ActionButton
              grow
              label="부스 상세 보기"
              onPress={() => {
                onClose();
                router.push(`/booths/${booth.boothId}`);
              }}
              variant="ghost"
            />
            <ActionButton
              grow
              label={booth.isEmergencyClosed ? '현재 예약 불가' : '이 부스 예약하기'}
              onPress={onReserve}
              variant="secondary"
              disabled={booth.isEmergencyClosed}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
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

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLabel}>
        <Feather color={palette.textMuted} name={icon} size={15} />
        <Text style={styles.infoLabelText}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 14, 29, 0.28)',
  },
  sheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  handleArea: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  handle: {
    width: 56,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#D3D9E9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerMain: {
    flex: 1,
    gap: 4,
  },
  code: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.inkMuted,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: palette.text,
  },
  meta: {
    color: palette.textMuted,
    fontSize: 13,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  scrollContent: {
    gap: 18,
    paddingBottom: 20,
  },
  hero: {
    height: 200,
    borderRadius: 24,
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
    fontWeight: '800',
    textAlign: 'center',
  },
  queueHero: {
    flexDirection: 'row',
    gap: 12,
  },
  queueHeroMain: {
    flex: 1.2,
    backgroundColor: palette.ink,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'space-between',
    minHeight: 156,
  },
  queueHeroLabel: {
    color: '#D6D4E6',
    fontSize: 12,
    fontWeight: '800',
  },
  queueHeroValue: {
    color: '#FFFFFF',
    fontSize: 48,
    lineHeight: 54,
    fontWeight: '900',
  },
  queueHeroSub: {
    color: '#D6D4E6',
    lineHeight: 20,
  },
  queueHeroSide: {
    flex: 1,
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
  section: {
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
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabelText: {
    color: palette.textMuted,
    fontWeight: '700',
  },
  infoValue: {
    color: palette.text,
    fontWeight: '700',
  },
  goodsSummaryCard: {
    gap: 14,
  },
  goodsSummaryCopy: {
    gap: 6,
  },
  goodsSummaryTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
  },
  goodsSummaryBody: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  muted: {
    color: palette.textMuted,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
});
