import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useAuth } from "../../context/auth";
import { darkTheme } from "@/constants/theme";
import { useEffect, useState } from "react";
import axiosInstance from "@/config/axios";
import { LANGUAGES } from "@/constants/language";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* <Text style={styles.title}>{t("profile.profile")}</Text> */}

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.support")}</Text>
        <TouchableOpacity
          style={styles.supportItem}
          onPress={() => router.push("/faq")}
        >
          <MaterialCommunityIcons
            name="frequently-asked-questions"
            size={24}
            color={darkTheme.colors.primary}
          />
          <View style={styles.supportItemContent}>
            <Text style={styles.supportItemTitle}>{t("profile.faq")}</Text>
            <Text style={styles.supportItemDescription}>
              {t("profile.faq_desc")}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportItem}
          onPress={() => router.push("/feedback")}
        >
          <MaterialCommunityIcons
            name="message-text-outline"
            size={24}
            color={darkTheme.colors.primary}
          />
          <View style={styles.supportItemContent}>
            <Text style={styles.supportItemTitle}>{t("profile.feedback")}</Text>
            <Text style={styles.supportItemDescription}>
              {t("profile.feedback_desc")}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.supportItem}
          onPress={() => router.push("/tutorial")}
        >
          <MaterialCommunityIcons
            name="book-open-variant"
            size={24}
            color={darkTheme.colors.primary}
          />
          <View style={styles.supportItemContent}>
            <Text style={styles.supportItemTitle}>{t("profile.tutorial")}</Text>
            <Text style={styles.supportItemDescription}>
              {t("profile.tutorial_desc")}
            </Text>
          </View>
        </TouchableOpacity>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32, // Add extra padding at the bottom for better scrolling
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    marginBottom: 12,
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
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  supportItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  supportItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: darkTheme.colors.text,
    marginBottom: 4,
  },
  supportItemDescription: {
    fontSize: 14,
    color: darkTheme.colors.textSecondary,
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
