import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";
type Props = {
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export default function OnboardingLayout({
  title,
  description,
  children,
}: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.content}>
          {title && <Text style={styles.title}>{title}</Text>}
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>

        {children}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    marginTop: 12,
    textAlign: "center",
  },
});