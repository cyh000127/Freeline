import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ExperienceState } from '@/types/experience';

interface Props {
  data: ExperienceState;
  onPrimaryPress?: () => void;
}

export default function ExperienceCard({ data, onPrimaryPress }: Props) {
  if (data.status === 'idle') {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>현재 체험 중인 부스가 없습니다.</Text>
      </View>
    );
  }

  const palette = getPalette(data.status);

  return (
    <View style={[styles.card, { backgroundColor: palette.bg }]}>
      {/* Title */}
      <Text style={[styles.title, { color: palette.text }]}>{data.boothName}</Text>

      {/* Pending (QR) */}
      {data.status === 'pending' && (
        <>
          <Text style={styles.desc}>입장 5분 전입니다. 도착 인증을 진행해주세요.</Text>

          <View style={styles.row}>
            <Pressable
              style={[styles.primaryBtn, { backgroundColor: '#6D28D9' }]}
              onPress={onPrimaryPress}
            >
              <Text style={styles.btnText}>도착 인증하기</Text>
            </Pressable>

            <Pressable style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>순서 미루기</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Active / Warning / Overdue */}
      {data.status !== 'pending' && (
        <>
          <Text style={[styles.time, { color: palette.text }]}>
            이용시간: {data.elapsedTime}
          </Text>

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: palette.button }]}
            onPress={onPrimaryPress}
          >
            <Text style={styles.btnText}>체험 종료하기</Text>
          </Pressable>

          <Text style={[styles.remaining, { color: palette.text }]}>
            {data.remainingTime}
          </Text>
        </>
      )}
    </View>
  );
}

function getPalette(status: ExperienceState['status']) {
  switch (status) {
    case 'active':
      return palette.active;
    case 'warning':
      return palette.warning;
    case 'overdue':
      return palette.overdue;
    case 'pending':
      return palette.pending;
    default:
      return palette.active;
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
  },

  desc: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },

  time: {
    marginTop: 8,
    fontSize: 14,
  },

  remaining: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },

  row: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },

  primaryBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  secondaryBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
  },

  btnText: {
    color: 'white',
    fontWeight: '600',
  },

  secondaryText: {
    color: '#374151',
    fontWeight: '500',
  },

  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  emptyText: {
    color: '#9CA3AF',
  },
});

const palette = {
  active: {
    bg: '#EAF9ED',
    text: '#4FB866',
    button: '#28A745',
  },
  warning: {
    bg: '#FFF6D6',
    text: '#C28800',
    button: '#C28800',
  },
  overdue: {
    bg: '#FFE8E6',
    text: '#FF4D4F',
    button: '#FF4D4F',
  },
  pending: {
    bg: '#F3F4F6',
    text: '#6B7280',
    button: '#6D28D9',
  },
};
