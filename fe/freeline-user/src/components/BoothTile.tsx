import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BoothSummary } from '@/features/api/booths';
import { palette } from '@/theme/colors';
import { getBoothCongestion } from '@/utils/booth-congestion';

type Props = {
  booth: BoothSummary;
  waitingCount?: number | null;
  selected?: boolean;
  onPress: () => void;
};

export function BoothTile({ booth, waitingCount = null, selected = false, onPress }: Props) {
  const congestion = getBoothCongestion(waitingCount, booth.isEmergencyClosed);

  return (
    <Pressable onPress={onPress} style={[styles.tile, selected ? styles.selected : null]}>
      <Text style={[styles.code, selected ? styles.selectedText : null]}>{booth.locationCode}</Text>
      <Text numberOfLines={2} style={[styles.name, selected ? styles.selectedText : null]}>
        {booth.name}
      </Text>
      <View
        style={[
          styles.state,
          {
            backgroundColor: congestion.backgroundColor,
            borderColor: congestion.outlineColor,
          },
        ]}
      >
        <Text style={[styles.stateText, { color: congestion.textColor }]}>
          {congestion.label}
        </Text>
      </View>
      <Text style={[styles.waiting, selected ? styles.selectedSubText : null]}>
        현재 대기 {waitingCount == null ? '확인 전' : `${waitingCount}명`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    backgroundColor: palette.surface,
    borderRadius: 22,
    minHeight: 138,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: palette.border,
  },
  selected: {
    backgroundColor: palette.ink,
    borderColor: palette.ink,
  },
  code: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textMuted,
  },
  name: {
    minHeight: 24,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: palette.text,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  selectedSubText: {
    color: '#D8D6E6',
  },
  state: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  waiting: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
