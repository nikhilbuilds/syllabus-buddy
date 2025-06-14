import { useAuth } from "@/context/auth";
import { LoadingScreen } from "@/components/loading-screen";
import { router } from "expo-router";
import { useEffect } from "react";
export default function HomeScreen() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      router.replace("/login");
    }
  }, [isLoading]);

  return <LoadingScreen />;
}
