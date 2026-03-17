import { StyleSheet, Text, View } from 'react-native';
import ActionChip from './ActionChip';
import ReservationMetaRow from './ReservationMetaRow';

type ReservationCardProps = {
  boothName: string;
  myOrderText?: string;
  estimatedWaitText?: string;
  statusLabel?: string;
  statusTone?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  actionLabel?: string;
  actionTone?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  onActionPress?: () => void;
  expanded?: boolean;
  details?: string[];
};

export default function ReservationCard({
  boothName,
  myOrderText,
  estimatedWaitText,
  statusLabel,
  statusTone = 'blue',
  actionLabel,
  actionTone = 'blue',
  onActionPress,
  expanded = false,
  details = [],
}: ReservationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{boothName}</Text>

        {actionLabel ? (
          <ActionChip label={actionLabel} tone={actionTone} onPress={onActionPress} />
        ) : null}
      </View>

      <View style={styles.metaGroup}>
        {myOrderText ? (
          <ReservationMetaRow label="내 대기번호:" value={myOrderText} />
        ) : null}

        {estimatedWaitText ? (
          <ReservationMetaRow label="예상 대기시간:" value={estimatedWaitText} />
        ) : null}
      </View>

      {statusLabel ? (
        <View style={styles.statusRow}>
          <ActionChip label={statusLabel} tone={statusTone} />
        </View>
      ) : null}

      {expanded && details.length > 0 ? (
        <View style={styles.expandedSection}>
          {details.map((detail, index) => (
            <Text key={`${detail}-${index}`} style={styles.detailText}>
              {detail}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#28234E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: 8,
  },
  metaGroup: {
    gap: 6,
  },
  statusRow: {
    alignItems: 'flex-start',
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 10,
    gap: 4,
  },
  detailText: {
    color: '#D6D6E2',
    fontSize: 12,
    lineHeight: 18,
  },
});
