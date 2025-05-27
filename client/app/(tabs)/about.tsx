import { router } from "expo-router";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";

export default function AboutScreen() {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.replace("/login")}
    >
      <Text style={styles.text}>About screen</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#fff",
  },
});
