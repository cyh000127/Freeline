import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type MyActionItemProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  helperText?: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
};

export default function MyActionItem({
  iconName,
  label,
  helperText,
  onPress,
  tone = 'default',
}: MyActionItemProps) {
  const isDanger = tone === 'danger';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, isDanger && styles.iconWrapDanger]}>
        <Ionicons name={iconName} size={20} color={isDanger ? '#D64545' : '#5B5BD6'} />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.label, isDanger && styles.labelDanger]}>{label}</Text>
        {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color="#A0A6B2" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapDanger: {
    backgroundColor: '#FDEEEE',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  labelDanger: {
    color: '#D64545',
  },
  helperText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '500',
    color: '#8A8FA3',
  },
  pressed: {
    opacity: 0.7,
  },
});
