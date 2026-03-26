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

  const targetHeight = expanded ? screenHeight - insets.top - 12 : Math.min(screenHeight * 0.58, 560);

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
              paddingTop: expanded ? insets.top + 8 : 10,
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

            {expanded ? (
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Feather color={palette.ink} name="x" size={20} />
              </Pressable>
            ) : null}
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

            <View style={styles.statsRow}>
              <InfoChip label="현재 대기" value={`${detail?.waitingCount ?? '-'}명`} />
              <InfoChip label="예상 시간" value={estimatedMinutes ? `약 ${estimatedMinutes}분` : '확인 전'} />
              <InfoChip label="상태" value={booth.isEmergencyClosed ? '긴급 마감' : '운영 중'} />
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

            <SectionBlock title="굿즈 현황">
              {loading ? <Text style={styles.muted}>부스 정보를 불러오는 중...</Text> : null}
              {!loading && detail?.goods.length ? (
                detail.goods.map((goods) => (
                  <View key={goods.goodsId} style={styles.goodsRow}>
                    <View style={styles.goodsText}>
                      <Text style={styles.goodsName}>{goods.name}</Text>
                      <Text style={styles.goodsSub}>
                        {goods.isSoldOut ? '현재 품절 상태입니다.' : '현장 수령 가능'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.goodsBadge,
                        goods.isSoldOut ? styles.soldOutBadge : styles.openBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.goodsBadgeText,
                          goods.isSoldOut ? styles.soldOutText : styles.openText,
                        ]}
                      >
                        {goods.isSoldOut ? '품절' : '판매중'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : null}
              {!loading && !detail?.goods.length ? (
                <Text style={styles.muted}>등록된 굿즈가 없습니다.</Text>
              ) : null}
            </SectionBlock>
          </ScrollView>

          <View style={styles.footer}>
            <ActionButton
              grow
              label={expanded ? '접어두기' : '전체 화면으로 보기'}
              onPress={onExpandToggle}
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
    paddingBottom: 16,
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
  statsRow: {
    flexDirection: 'row',
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
  goodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  goodsText: {
    flex: 1,
    gap: 4,
  },
  goodsName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  goodsSub: {
    color: palette.textMuted,
    fontSize: 12,
  },
  goodsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  openBadge: {
    backgroundColor: '#EAFBF1',
  },
  soldOutBadge: {
    backgroundColor: '#FFF0F0',
  },
  goodsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  openText: {
    color: palette.success,
  },
  soldOutText: {
    color: palette.danger,
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
