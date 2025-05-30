import { Stack } from "expo-router";
import { AuthProvider } from "../context/auth";
import { Fragment, useEffect } from "react";
import { SplashScreen } from "expo-router";
import { useAuth } from "../context/auth";
import { View, ActivityIndicator } from "react-native";
import { LoadingScreen } from "@/components/loading-screen";
import { darkTheme } from "../constants/theme";
import { NotificationService } from "@/services/notificationService";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, isLoading } = useAuth();

  console.log("session", session);
  console.log("isLoading", isLoading);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    const initializeNotifications = async () => {
      console.log("Initializing notifications...");

      // Force regenerate token every app start (for testing)
      await NotificationService.regeneratePushToken();

      // Setup listeners
      NotificationService.setupNotificationListeners();
    };

    initializeNotifications();
  }, []);

  return (
    <Fragment>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: darkTheme.colors.card,
          },
          headerTintColor: darkTheme.colors.text,
          contentStyle: {
            backgroundColor: darkTheme.colors.background,
          },
        }}
      >
        <Fragment>
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
        </Fragment>
      </Stack>
      <Stack.Protected guard={session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Fragment>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
