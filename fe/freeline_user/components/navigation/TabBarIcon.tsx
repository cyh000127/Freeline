import { Ionicons } from '@expo/vector-icons';
import type { TabKey } from './BottomTabBar';

type TabBarIconProps = {
  tab: TabKey;
  isActive?: boolean;
};

const ACTIVE_COLOR = '#000000';
const INACTIVE_COLOR = 'rgba(255,255,255,0.72)';

export default function TabBarIcon({ tab, isActive = false }: TabBarIconProps) {
  const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
  const size = 22;

  switch (tab) {
    case 'home':
      return <Ionicons name={'home-outline'} size={size} color={color} />;
    case 'reservation':
      return <Ionicons name={'document-outline'} size={size} color={color} />;
    case 'map':
      return <Ionicons name={'map-outline'} size={size} color={color} />;
    case 'my':
      return <Ionicons name={'person-outline'} size={size} color={color} />;
    case 'search':
      return <Ionicons name="search" size={size} color={color} />;
    default:
      return null;
  }
}
