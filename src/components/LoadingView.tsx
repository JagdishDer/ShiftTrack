import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LoadingView({
  label = "Getting things ready",
}: {
  label?: string;
}) {
  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <View style={styles.mark}>
        <ActivityIndicator color="#163D31" />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F6F2",
    gap: 14,
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C8F36A",
  },
  label: { color: "#65716B", fontSize: 14 },
});
