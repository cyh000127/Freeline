import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function TicketConfirmScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 20, textAlign: 'center' }}>
        예매하신 정보가 맞으신가요?
      </Text>
      <Text>
        박람회: AW 2026 스마트 제조혁신 산업전 {'\n'}
        닉네임: 청아한 두루미 {'\n'}
        기간: 26.03.06 ~ 26.03.08
      </Text>
      <Pressable
        style={{
          marginTop: 20,
          backgroundColor: '#3C355F',
          padding: 14,
          borderRadius: 8,
        }}
        onPress={() => router.replace('/(tabs)/home')}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>확인</Text>
      </Pressable>
    </View>
  );
}
