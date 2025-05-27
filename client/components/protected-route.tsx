import { Fragment, useEffect } from "react";
import { useAuth } from "../context/auth";
import { useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { PropsWithChildren } from "react";
import { LoadingScreen } from "./loading-screen";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
