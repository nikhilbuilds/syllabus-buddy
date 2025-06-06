import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import axiosInstance from "@/config/axios";
import { darkTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LANGUAGES } from "@/constants/language";

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (syllabusId: number) => void;
  user: any;
}

export default function UploadModal({
  visible,
  onClose,
  onSuccess,
  user,
}: UploadModalProps) {
  const [uploadType, setUploadType] = useState<"file" | "description" | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [syllabusTitle, setSyllabusTitle] = useState("");
  const [syllabusDescription, setSyllabusDescription] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(
    user?.preferredLanguage
  );
  const [dailyStudyMinutes, setDailyStudyMinutes] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setUploadType(null);
    setSelectedFile(null);
    setSyllabusTitle("");
    setSyllabusDescription("");
    setSelectedLanguage(user?.preferredLanguage);
    setDailyStudyMinutes("");
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUploadTypeSelect = (type: "file" | "description") => {
    setUploadType(type);
    if (type === "file") {
      pickDocument();
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
        setSyllabusTitle(result.assets[0].name.replace(/\.[^/.]+$/, ""));
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleSubmit = async () => {
    if (!syllabusTitle.trim()) {
      Alert.alert("Error", "Please enter a syllabus title");
      return;
    }

    if (uploadType === "file" && !selectedFile) {
      Alert.alert("Error", "Please select a file");
      return;
    }

    if (uploadType === "description" && !syllabusDescription.trim()) {
      Alert.alert("Error", "Please enter a syllabus description");
      return;
    }

    if (!dailyStudyMinutes.trim() || isNaN(Number(dailyStudyMinutes))) {
      Alert.alert(
        "Error",
        "Please enter a valid number of daily study minutes"
      );
      return;
    }

    setIsUploading(true);
    try {
      let response;

      if (uploadType === "file") {
        // File upload
        const formData = new FormData();
        formData.append("file", {
          uri: selectedFile.uri,
          type: selectedFile.mimeType,
          name: selectedFile.name,
        } as any);
        formData.append("title", syllabusTitle);
        formData.append("preferredLanguage", selectedLanguage);
        formData.append("dailyStudyMinutes", dailyStudyMinutes);

        response = await axiosInstance.post(
          "/syllabus/upload-queue",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {
        // Description upload
        response = await axiosInstance.post("/syllabus/create", {
          title: syllabusTitle,
          description: syllabusDescription,
          preferredLanguage: selectedLanguage,
          dailyStudyMinutes: Number(dailyStudyMinutes),
        });
      }

      Alert.alert("Success", "Syllabus created successfully!");
      handleClose();
      onSuccess(response.data.syllabusId);
    } catch (error) {
      console.error("Error creating syllabus:", error);
      Alert.alert("Error", "Failed to create syllabus. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const renderUploadTypeSelection = () => (
    <View style={styles.uploadTypeContainer}>
      <Text style={styles.sectionTitle}>
        How would you like to create your syllabus?
      </Text>

      <TouchableOpacity
        style={styles.uploadTypeOption}
        onPress={() => handleUploadTypeSelect("file")}
      >
        <View style={styles.uploadTypeIcon}>
          <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
        </View>
        <View style={styles.uploadTypeContent}>
          <Text style={styles.uploadTypeTitle}>Upload File</Text>
          <Text style={styles.uploadTypeDescription}>
            Upload a PDF or text file containing your syllabus
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={darkTheme.colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uploadTypeOption}
        onPress={() => handleUploadTypeSelect("description")}
      >
        <View style={styles.uploadTypeIcon}>
          <Ionicons name="create-outline" size={32} color="#007AFF" />
        </View>
        <View style={styles.uploadTypeContent}>
          <Text style={styles.uploadTypeTitle}>Describe Syllabus</Text>
          <Text style={styles.uploadTypeDescription}>
            Manually enter your syllabus content and topics
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={darkTheme.colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      {/* Language Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Language</Text>
        <View style={styles.languageOptions}>
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                selectedLanguage === language.code &&
                  styles.selectedLanguageOption,
              ]}
              onPress={() => setSelectedLanguage(language.code)}
            >
              <Text style={styles.languageIcon}>{language.icon}</Text>
              <Text
                style={[
                  styles.languageText,
                  selectedLanguage === language.code &&
                    styles.selectedLanguageText,
                ]}
              >
                {language.name}
              </Text>
              {selectedLanguage === language.code && (
                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Title Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Syllabus Title *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter syllabus title"
          placeholderTextColor={darkTheme.colors.textSecondary}
          value={syllabusTitle}
          onChangeText={setSyllabusTitle}
        />
      </View>

      {/* Daily Study Minutes Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Daily Study Minutes *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter daily study minutes"
          placeholderTextColor={darkTheme.colors.textSecondary}
          value={dailyStudyMinutes}
          onChangeText={setDailyStudyMinutes}
          keyboardType="numeric"
        />
      </View>

      {/* File or Description Input */}
      {uploadType === "file" ? (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Selected File</Text>
          {selectedFile ? (
            <View style={styles.fileInfo}>
              <Ionicons name="document" size={20} color="#007AFF" />
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <TouchableOpacity onPress={pickDocument}>
                <Text style={styles.changeFileText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.filePickerButton}
              onPress={pickDocument}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
              <Text style={styles.filePickerText}>Select File</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Syllabus Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe your syllabus content, topics, and learning objectives..."
            placeholderTextColor={darkTheme.colors.textSecondary}
            value={syllabusDescription}
            onChangeText={setSyllabusDescription}
            multiline
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          isUploading && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="checkmark" size={20} color="white" />
        )}
        <Text style={styles.submitButtonText}>
          {isUploading ? "Creating..." : "Create Syllabus"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Syllabus</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={darkTheme.colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!uploadType ? renderUploadTypeSelection() : renderForm()}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: darkTheme.colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    minHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: darkTheme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  uploadTypeContainer: {
    padding: 20,
  },
  uploadTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: darkTheme.colors.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  uploadTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  uploadTypeContent: {
    flex: 1,
  },
  uploadTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: darkTheme.colors.text,
    marginBottom: 4,
  },
  uploadTypeDescription: {
    fontSize: 14,
    color: darkTheme.colors.textSecondary,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: darkTheme.colors.text,
    marginBottom: 12,
  },
  languageOptions: {
    flexDirection: "row",
    gap: 12,
  },
  languageOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: darkTheme.colors.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 8,
  },
  selectedLanguageOption: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF10",
  },
  languageIcon: {
    fontSize: 20,
  },
  languageText: {
    fontSize: 14,
    color: darkTheme.colors.text,
    fontWeight: "500",
  },
  selectedLanguageText: {
    color: "#007AFF",
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: darkTheme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: darkTheme.colors.background,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: darkTheme.colors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: darkTheme.colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
    gap: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: darkTheme.colors.text,
  },
  changeFileText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  filePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkTheme.colors.background,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 20,
    gap: 8,
  },
  filePickerText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
