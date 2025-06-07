import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/auth";
import { darkTheme } from "@/constants/theme";
import { useEffect, useState } from "react";
import axiosInstance from "@/config/axios";
import { LANGUAGES } from "@/constants/language";
import { useTranslation } from "react-i18next";

export default function ProfileScreen() {
  const { signOut, isLoading, user } = useAuth();
  const [userData, setUserData] = useState<any>(user);
  const { t } = useTranslation();
  useEffect(() => {
    const fetchUserData = async () => {
      const response = await axiosInstance.get("/users/profile");
      const language = LANGUAGES.find(
        (lang) => lang.code === response.data.user.preferredLanguage
      );

      setUserData({
        ...response.data.user,
        language: language?.name,
        icon: language?.icon,
      });
    };
    fetchUserData();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("profile.profile")}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>{t("profile.name")}</Text>
        <Text style={styles.value}>{userData?.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("profile.email")}</Text>
        <Text style={styles.value}>{userData?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("profile.preferred_language")}</Text>
        <Text style={styles.value}>
          {userData?.language} {userData?.icon}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, isLoading && styles.disabledButton]}
        onPress={signOut}
        disabled={isLoading}
      >
        <Text style={styles.logoutText}>
          {isLoading ? t("profile.logging_out") : t("profile.logout")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: darkTheme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: darkTheme.colors.text,
  },
  section: {
    marginBottom: 20,
    backgroundColor: darkTheme.colors.card,
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: darkTheme.colors.text,
  },
  logoutButton: {
    backgroundColor: darkTheme.colors.error,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: {
    color: darkTheme.colors.text,
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: `${darkTheme.colors.error}80`, // 50% opacity
  },
});
