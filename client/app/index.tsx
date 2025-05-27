import { useAuth } from "@/context/auth";
import { View, Text, StyleSheet } from "react-native";
import { LoadingScreen } from "@/components/loading-screen";
export default function HomeScreen() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Text>Welcome to Syllabus Buddy</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
