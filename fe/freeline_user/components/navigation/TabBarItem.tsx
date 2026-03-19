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
    borderRadius: 999,
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  activeItem: {
    backgroundColor: '#A09EAB',
  },
  iconWrapper: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '600',
  },
  activeLabel: {
    color: '#000000',
    fontWeight: '700',
  },
});
