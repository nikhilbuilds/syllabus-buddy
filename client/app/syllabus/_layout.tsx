import { Stack } from "expo-router";
import { darkTheme } from "@/constants/theme";

export default function SyllabusLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: darkTheme.colors.card,
        },
        headerTintColor: darkTheme.colors.text,
        contentStyle: {
          backgroundColor: darkTheme.colors.background,
        },
      }}
    />
  );
}
