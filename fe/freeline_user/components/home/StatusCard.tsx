import { Pressable, StyleSheet, Text, View } from 'react-native';

type StatusCardProps = {
  title: string;
  description?: string;
  buttonLabel?: string;
  onPress?: () => void;
};

export default function StatusCard({
  title,
  description,
  buttonLabel,
  onPress,
}: StatusCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {description ? <Text style={styles.description}>{description}</Text> : null}

      {buttonLabel ? (
        <Pressable style={styles.button} onPress={onPress}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E7EE',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  description: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#777777',
  },
  button: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#6E5AE6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
