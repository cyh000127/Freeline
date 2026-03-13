import { useRouter } from 'expo-router';
import { View, TextInput, Text, Pressable } from 'react-native';

export default function NicknameInputScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 22, marginBottom: 20, textAlign: 'center' }}>
        닉네임을 설정해주세요.
      </Text>

      <TextInput
        placeholder="닉네임"
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
        }}
      />

      <Pressable
        style={{
          marginTop: 20,
          backgroundColor: '#3C355F',
          padding: 14,
          borderRadius: 8,
        }}
        onPress={() => router.push('./confirm')}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>확인</Text>
      </Pressable>
    </View>
  );
}
