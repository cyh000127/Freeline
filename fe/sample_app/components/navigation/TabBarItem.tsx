import { Pressable, StyleSheet, Text, View } from 'react-native';

type TabBarItemProps = {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
};

export default function TabBarItem({
  label,
  isActive = false,
  onPress,
  icon,
}: TabBarItemProps) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
      {isActive && <View style={styles.activeIndicator} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
    position: 'relative',
  },
  iconWrapper: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: '#9A9AA5',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#4A3F7A',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#6E5CD3',
  },
});
