import { View, ActivityIndicator } from "react-native";

export function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#25292e",
      }}
    >
      <ActivityIndicator size="large" color="#ffd33d" />
    </View>
  );
}
