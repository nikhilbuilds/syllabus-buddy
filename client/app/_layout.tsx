import { Stack } from "expo-router";
import { AuthProvider } from "../context/auth";
import { Fragment, useEffect, useState } from "react";
import { SplashScreen } from "expo-router";
import { useAuth } from "../context/auth";
import { View, ActivityIndicator } from "react-native";
import { LoadingScreen } from "@/components/loading-screen";
import { darkTheme } from "../constants/theme";
import { NotificationService } from "@/services/notificationService";
import onboardingService from "../services/onboardingService";
import { useLanguage } from "./hooks/useLanguage";
import "./i18n/config"; // Import i18n config

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { currentLanguage } = useLanguage(); // Initialize language

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    const initializeNotifications = async () => {
      console.log("Initializing notifications...");
      NotificationService.setupNotificationListeners();
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
  }, [session]);

  const checkOnboardingStatus = async () => {
    if (session) {
      try {
        const status = await onboardingService.getOnboardingStatus();
        setNeedsOnboarding(!status.data.isOnboardingComplete);
      } catch (error) {
        console.log("Onboarding status check failed:", error);
      }
    }
  };

  return (
    <Fragment>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: darkTheme.colors.background,
          },
          headerTintColor: darkTheme.colors.text,
          contentStyle: {
            backgroundColor: darkTheme.colors.background,
          },
        }}
      >
        <Fragment>
          <Stack.Screen name="login" />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
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
