import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BoothSummary } from '@/features/api/booths';
import { palette } from '@/theme/colors';

type Props = {
  booth: BoothSummary;
  selected?: boolean;
  onPress: () => void;
};

export function BoothTile({ booth, selected = false, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, selected ? styles.selected : null]}>
      <Text style={[styles.code, selected ? styles.selectedText : null]}>{booth.locationCode}</Text>
      <Text numberOfLines={2} style={[styles.name, selected ? styles.selectedText : null]}>
        {booth.name}
      </Text>
      <View style={[styles.state, booth.isEmergencyClosed ? styles.closed : styles.open]}>
        <Text style={[styles.stateText, booth.isEmergencyClosed ? styles.closedText : styles.openText]}>
          {booth.isEmergencyClosed ? '긴급 마감' : '운영 중'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '48%',
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 16,
    gap: 12,
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
    minHeight: 42,
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  state: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  open: {
    backgroundColor: '#EAFBF1',
  },
  closed: {
    backgroundColor: '#FFF0F0',
  },
  stateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  openText: {
    color: palette.success,
  },
  closedText: {
    color: palette.danger,
  },
});
