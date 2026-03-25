import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  message: string;
  timeText: string;
  isRead?: boolean;
  type?: string;
  onPress?: () => void;
};

export default function NotificationItem({
  title,
  message,
  timeText,
  isRead,
  onPress,
}: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.container, !isRead && styles.unread]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.time}>{timeText}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  unread: {
    backgroundColor: '#F5F5FF',
  },
  title: {
    fontWeight: '800',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
});
