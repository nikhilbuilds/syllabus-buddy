import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
// import { Picker } from "@react-native-picker/picker"; // Comment out for now
import { router } from "expo-router";
import onboardingService from "../../services/onboardingService";

const TARGET_EXAMS = [
  { label: "Select Target Exam", value: "" },
  { label: "UPSC Civil Services", value: "UPSC" },
  { label: "Data Structures & Algorithms", value: "DSA" },
  { label: "JEE Main/Advanced", value: "JEE" },
  { label: "NEET", value: "NEET" },
  { label: "CAT", value: "CAT" },
  { label: "GATE", value: "GATE" },
  { label: "Other", value: "OTHER" },
];

const LANGUAGES = [
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
];

export default function PersonalInfoScreen() {
  const [formData, setFormData] = useState({
    age: "",
    currentOccupation: "",
    preferredLanguage: "en",
    learningGoals: "",
    targetExam: "",
    additionalNotes: "",
  });
  const [loading, setLoading] = useState(false);

  // Temporary grade options for TouchableOpacity picker
  const gradeOptions = [
    "9th Grade",
    "10th Grade",
    "11th Grade",
    "12th Grade",
    "Undergraduate",
    "Graduate",
    "Other",
  ];

  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showExamPicker, setShowExamPicker] = useState(false);

  const handleComplete = async () => {
    if (!formData.age || !formData.currentOccupation) {
      Alert.alert(
        "Missing Information",
        "Please fill in your age and current occupation."
      );
      return;
    }

    setLoading(true);
    try {
      const onboardingData = {
        age: parseInt(formData.age),
        currentOccupation: formData.currentOccupation,
        preferredLanguage: formData.preferredLanguage,
        learningGoals: formData.learningGoals || undefined,
        targetExam: formData.targetExam || undefined,
        additionalNotes: formData.additionalNotes || undefined,
      };

      await onboardingService.completeOnboarding(onboardingData);

      Alert.alert(
        "Profile Complete!",
        "Your profile has been set up. Don't forget to verify your email to unlock all features!",
        [
          {
            text: "Start Learning",
            onPress: () => router.replace("/(tabs)"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            Help us personalize your learning experience
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder="Enter your age"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Occupation *</Text>
            <TextInput
              style={styles.input}
              value={formData.currentOccupation}
              onChangeText={(text) =>
                setFormData({ ...formData, currentOccupation: text })
              }
              placeholder="e.g., Student, Software Engineer, Teacher"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Language</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowLanguagePicker(!showLanguagePicker)}
              >
                <Text style={styles.pickerButtonText}>
                  {formData.preferredLanguage === "en"
                    ? "English"
                    : formData.preferredLanguage === "hi"
                    ? "Hindi"
                    : formData.preferredLanguage === "es"
                    ? "Spanish"
                    : "French"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showLanguagePicker && (
            <View style={styles.optionsContainer}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  style={styles.option}
                  onPress={() => {
                    setFormData({ ...formData, preferredLanguage: lang.value });
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text style={styles.optionText}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Exam/Subject</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowExamPicker(!showExamPicker)}
              >
                <Text style={styles.pickerButtonText}>
                  {formData.targetExam === "UPSC"
                    ? "UPSC Civil Services"
                    : formData.targetExam === "DSA"
                    ? "Data Structures & Algorithms"
                    : formData.targetExam === "JEE"
                    ? "JEE Main/Advanced"
                    : formData.targetExam === "NEET"
                    ? "NEET"
                    : formData.targetExam === "CAT"
                    ? "CAT"
                    : formData.targetExam === "GATE"
                    ? "GATE"
                    : "Select Target Exam"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showExamPicker && (
            <View style={styles.optionsContainer}>
              {TARGET_EXAMS.map((exam) => (
                <TouchableOpacity
                  key={exam.value}
                  style={styles.option}
                  onPress={() => {
                    setFormData({ ...formData, targetExam: exam.value });
                    setShowExamPicker(false);
                  }}
                >
                  <Text style={styles.optionText}>{exam.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Learning Goals</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.learningGoals}
              onChangeText={(text) =>
                setFormData({ ...formData, learningGoals: text })
              }
              placeholder="What do you want to achieve? (optional)"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.additionalNotes}
              onChangeText={(text) =>
                setFormData({ ...formData, additionalNotes: text })
              }
              placeholder="Any specific requirements or expectations? (optional)"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.completeButton, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            <Text style={styles.completeButtonText}>
              {loading ? "Setting up..." : "Complete Setup"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  textArea: {
    minHeight: 80,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f8f9fa",
  },
  pickerButtonText: {
    color: "#333",
  },
  optionsContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: {
    fontSize: 16,
  },
  completeButton: {
    backgroundColor: "#28a745",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  completeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
