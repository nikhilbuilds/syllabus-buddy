import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/auth";
import { SplashScreen } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export function InitialLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  console.log("isAuthenticated", isAuthenticated);
  console.log("isLoading", isLoading);

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === "(tabs)";
      const inAuthScreen = segments[0] === "login" || segments[0] === "signup";

      console.log("inAuthGroup", inAuthGroup);
      console.log("inAuthScreen", inAuthScreen);
      console.log("isAuthenticated", isAuthenticated);

      if (!isAuthenticated) {
        router.replace("/login");
      } else if (isAuthenticated && inAuthScreen) {
        //  router.replace("/(tabs)");
      }

      try {
        console.log("hiding splash screen");
        SplashScreen.hideAsync();
      } catch (error) {
        // Ignore error from hiding splash screen
      }
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ffd33d" />
      </View>
    );
  }

  return null;
}
