import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BoothDetail, BoothSummary } from '@/features/api/booths';
import { palette } from '@/theme/colors';
import { getBoothCongestion } from '@/utils/booth-congestion';

type Props = {
  booth: BoothSummary;
  boothDetail?: BoothDetail;
  waitingCount?: number | null;
  selected?: boolean;
  onPress: () => void;
};

export function BoothListCard({
  booth,
  boothDetail,
  waitingCount = null,
  selected = false,
  onPress,
}: Props) {
  const congestion = getBoothCongestion(waitingCount, booth.isEmergencyClosed);

  return (
    <Pressable onPress={onPress} style={[styles.card, selected ? styles.selected : null]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.code}>{booth.locationCode}</Text>
          <Text style={[styles.name, selected ? styles.selectedText : null]}>{booth.name}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: congestion.backgroundColor,
              borderColor: congestion.outlineColor,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: congestion.textColor }]}>
            {congestion.label}
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>현재 대기</Text>
          <Text style={[styles.summaryValue, selected ? styles.selectedText : null]}>
            {waitingCount == null ? '-' : `${waitingCount}명`}
          </Text>
        </View>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>운영 시간</Text>
          <Text style={[styles.summaryValue, selected ? styles.selectedText : null]}>
            {booth.openTime} - {booth.closeTime}
          </Text>
        </View>
      </View>

      <View style={styles.metaList}>
        <MetaItem icon="map-pin" label={booth.locationCode} selected={selected} />
        <MetaItem
          icon="users"
          label={
            boothDetail ? `${boothDetail.callCount}명 동시 호출` : '상세 정보 확인 가능'
          }
          selected={selected}
        />
        <MetaItem
          icon="gift"
          label={boothDetail ? `굿즈 ${boothDetail.goods.length}종` : '굿즈 정보 확인 가능'}
          selected={selected}
        />
      </View>
    </Pressable>
  );
}

function MetaItem({
  icon,
  label,
  selected,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  selected: boolean;
}) {
  return (
    <View style={styles.metaItem}>
      <Feather color={selected ? '#D8D6E6' : palette.textMuted} name={icon} size={14} />
      <Text numberOfLines={1} style={[styles.metaText, selected ? styles.selectedMetaText : null]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  selected: {
    backgroundColor: palette.ink,
    borderColor: palette.ink,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  code: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  name: {
    color: palette.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryBlock: {
    flex: 1,
    backgroundColor: 'rgba(109, 104, 140, 0.08)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  metaList: {
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    flex: 1,
    color: palette.textMuted,
    fontSize: 13,
  },
  selectedMetaText: {
    color: '#D8D6E6',
  },
});
