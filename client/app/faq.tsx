import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { darkTheme } from "@/constants/theme";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQScreen() {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: t("faq.how_to_upload"),
      answer: t("faq.how_to_upload_answer"),
    },
    {
      question: t("faq.supported_formats"),
      answer: t("faq.supported_formats_answer"),
    },
    {
      question: t("faq.processing_time"),
      answer: t("faq.processing_time_answer"),
    },
    {
      question: t("faq.edit_syllabus"),
      answer: t("faq.edit_syllabus_answer"),
    },
    {
      question: t("faq.delete_syllabus"),
      answer: t("faq.delete_syllabus_answer"),
    },
    {
      question: t("faq.privacy"),
      answer: t("faq.privacy_answer"),
    },
  ];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleContactSupport = async () => {
    try {
      const emailUrl = `mailto:support@syllabusbuddy.com?subject=${encodeURIComponent(
        "SyllabusBuddy Support Request"
      )}`;
      const canOpen = await Linking.canOpenURL(emailUrl);

      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert(t("common.error"), t("faq.email_client_error"), [
          { text: t("common.ok") },
        ]);
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("faq.email_client_error"), [
        { text: t("common.ok") },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: t("faq.title"),
          headerStyle: {
            backgroundColor: darkTheme.colors.background,
          },
          headerTintColor: darkTheme.colors.text,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>{t("faq.subtitle")}</Text>
        </View>

        <View style={styles.faqContainer}>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => toggleExpand(index)}
            >
              <View style={styles.questionContainer}>
                <Text style={styles.question}>{faq.question}</Text>
                <Ionicons
                  name={expandedId === index ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={darkTheme.colors.textSecondary}
                />
              </View>
              {expandedId === index && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answer}>{faq.answer}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.contactContainer}>
          <Text style={styles.contactText}>{t("faq.contact_support")}</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.contactButtonText}>
              {t("faq.contact_button")}
            </Text>
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
  faqContainer: {
    padding: 15,
  },
  faqItem: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
  },
  questionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  question: {
    fontSize: 16,
    fontWeight: "500",
    color: darkTheme.colors.text,
    flex: 1,
    marginRight: 10,
  },
  answerContainer: {
    padding: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.border,
  },
  answer: {
    fontSize: 14,
    color: darkTheme.colors.textSecondary,
    lineHeight: 20,
  },
  contactContainer: {
    padding: 20,
    alignItems: "center",
  },
  contactText: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
    marginBottom: 15,
    textAlign: "center",
  },
  contactButton: {
    backgroundColor: darkTheme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
