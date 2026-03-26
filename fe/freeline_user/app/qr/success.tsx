import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

function formatRegisteredAt(value: string | string[] | undefined) {
  if (typeof value !== 'string' || value.length === 0) {
    return new Date().toLocaleString();
  }

  return new Date(value).toLocaleString();
}

export default function QRSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const boothName = (params.boothName as string) ?? '부스';
  const from = (params.from as string) ?? 'home';
  const registeredAt = formatRegisteredAt(params.registeredAt);

  const handleReturn = () => {
    if (from === 'reservation') {
      router.replace('/reservation');
    } else {
      router.replace('/home');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Image
          source={require('@/assets/icons/confirm_icon.png')}
          style={styles.icon}
        />
      </View>

      <Text style={styles.title}>도착 인증 완료</Text>
      <Text style={styles.subtitle}>입장 대기 상태로 변경되었습니다.</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>인증 부스</Text>
          <Text style={styles.value}>{boothName}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>인증 일시</Text>
          <Text style={styles.value}>{registeredAt}</Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={handleReturn}>
        <Text style={styles.buttonText}>돌아가기</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 24,
  },
  icon: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 32,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    padding: 18,
    marginBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  row: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2E',
    marginVertical: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#C7F052',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0B0B0D',
    fontWeight: '800',
    fontSize: 15,
  },
});
