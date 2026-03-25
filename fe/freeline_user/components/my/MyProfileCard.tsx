import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type MyProfileCardProps = {
  nickname: string;
  description?: string;
  onEditPress?: () => void;
};

export default function MyProfileCard({
  nickname,
  description = '현재 이용 중인 닉네임',
  onEditPress,
}: MyProfileCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name="person-outline" size={22} color="#5B5BD6" />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.nickname}>{nickname}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      {onEditPress ? (
        <Pressable
          onPress={onEditPress}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <Text style={styles.editText}>닉네임 변경</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8FA3',
  },
  editButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444444',
  },
  pressed: {
    opacity: 0.7,
  },
});
