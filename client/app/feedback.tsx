import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import axiosInstance from "@/config/axios";
import { Stack } from "expo-router";
import { darkTheme } from "@/constants/theme";

export default function FeedbackScreen() {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: "bug", label: t("feedback.categories.bug") },
    { id: "feature", label: t("feedback.categories.feature") },
    { id: "improvement", label: t("feedback.categories.improvement") },
    { id: "other", label: t("feedback.categories.other") },
  ];

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert(t("feedback.error.title"), t("feedback.error.empty"));
      return;
    }

    if (!category) {
      Alert.alert(t("feedback.error.title"), t("feedback.error.no_category"));
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post("/feedback", {
        category,
        content: feedback.trim(),
      });

      if (response.status === 201) {
        Alert.alert(
          t("feedback.success.title"),
          t("feedback.success.message"),
          [
            {
              text: t("common.ok"),
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(response.data.message || t("feedback.error.submit"));
      }
    } catch (error: any) {
      Alert.alert(
        t("feedback.error.title"),
        error.response?.data?.message || t("feedback.error.submit")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: t("feedback.title"),
          headerStyle: {
            backgroundColor: darkTheme.colors.background,
          },
          headerTintColor: darkTheme.colors.text,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>{t("feedback.subtitle")}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t("feedback.category")}</Text>
          <View style={styles.categories}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  category === cat.id && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    category === cat.id && styles.categoryButtonTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t("feedback.message")}</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={6}
            placeholder={t("feedback.placeholder")}
            placeholderTextColor={darkTheme.colors.textSecondary}
            value={feedback}
            onChangeText={setFeedback}
            textAlignVertical="top"
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={darkTheme.colors.text} />
            ) : (
              <Text style={styles.submitButtonText}>
                {t("feedback.submit")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: darkTheme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  subtitle: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: darkTheme.colors.text,
    marginBottom: 10,
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
    backgroundColor: darkTheme.colors.card,
  },
  categoryButtonActive: {
    backgroundColor: darkTheme.colors.primary,
    borderColor: darkTheme.colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: darkTheme.colors.text,
  },
  categoryButtonTextActive: {
    color: darkTheme.colors.text,
  },
  input: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
    marginBottom: 20,
    minHeight: 150,
    color: darkTheme.colors.text,
  },
  submitButton: {
    backgroundColor: darkTheme.colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
