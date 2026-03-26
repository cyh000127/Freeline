import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { palette } from '@/theme/colors';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.wrap}>
      <Feather color={palette.danger} name="alert-triangle" size={18} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#FFF3F3',
    borderWidth: 1,
    borderColor: '#FFD7D7',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: {
    flex: 1,
    color: '#9C3535',
    lineHeight: 18,
    fontSize: 13,
  },
});
