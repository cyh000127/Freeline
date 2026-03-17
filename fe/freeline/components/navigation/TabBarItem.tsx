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
    <Pressable style={[styles.item, isActive && styles.activeItem]} onPress={onPress}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  activeItem: {
    backgroundColor: '#A09EAB',
  },
  iconWrapper: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
