import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ActionChip from './ActionChip';
import ReservationMetaRow from './ReservationMetaRow';

type Tone = 'blue' | 'green' | 'yellow' | 'red' | 'gray';

type ReservationCardProps = {
  boothName: string;
  myOrderText?: string;
  estimatedWaitText?: string;
  visitTimeText?: string;
  boothLocationText?: string;
  statusLabel?: string;
  statusTone?: Tone;
  onCardPress?: () => void;
  expandIndicator?: React.ReactNode;

  children?: React.ReactNode;

  /**
   * Shows the divider under the summary section.
   * Useful for expandable cards that should still show
   * the bottom line even when collapsed.
   */
  showDivider?: boolean;
};

export default function ReservationCard({
  boothName,
  myOrderText,
  estimatedWaitText,
  visitTimeText,
  boothLocationText,
  statusLabel,
  statusTone = 'blue',
  onCardPress,
  expandIndicator,
  children,
  showDivider = false,
}: ReservationCardProps) {
  const Container = onCardPress ? Pressable : View;

  return (
    <Container style={styles.card} onPress={onCardPress}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {boothName}
        </Text>

        {statusLabel ? <ActionChip label={statusLabel} tone={statusTone} /> : null}
      </View>

      <View style={styles.metaGroup}>
        {myOrderText ? (
          <ReservationMetaRow label="내 대기번호:" value={myOrderText} />
        ) : null}

        {estimatedWaitText ? (
          <ReservationMetaRow label="예상 대기시간:" value={estimatedWaitText} />
        ) : null}

        {visitTimeText ? (
          <ReservationMetaRow label="관람 시간:" value={visitTimeText} />
        ) : null}

        {boothLocationText ? (
          <ReservationMetaRow label="관람 위치:" value={boothLocationText} />
        ) : null}
      </View>

      {showDivider ? <View style={styles.divider} /> : null}

      {children ? <View style={styles.content}>{children}</View> : null}

      {expandIndicator ? (
        <View style={styles.indicatorWrap}>{expandIndicator}</View>
      ) : null}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2F2C53',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    paddingTop: 2,
  },
  metaGroup: {
    marginTop: 10,
    gap: 8,
  },
  divider: {
    marginTop: 5,
    marginBottom: 5,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  content: {
    gap: 10,
  },
  indicatorWrap: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
