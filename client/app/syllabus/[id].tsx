import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import axiosInstance from "@/config/axios";
import { darkTheme } from "@/constants/theme";
import { QuizLevel } from "@/constants/quiz";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/context/auth";

interface Topic {
  id: number;
  title: string;
  dayIndex: number;
  estimatedTimeMinutes: number;
}

interface SyllabusDetail {
  id: number;
  title: string;
  topics: Topic[];
}

interface Question {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
  explanation: string;
}

const LANGUAGES = [
  { code: "en", name: "English", icon: "🇺🇸" },
  { code: "hi", name: "Hindi", icon: "🇮🇳" },
];

export default function SyllabusDetailScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [syllabus, setSyllabus] = useState<SyllabusDetail | null>(null);
  const [isParsingTopics, setIsParsingTopics] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [dailyMinutes, setDailyMinutes] = useState("");
  const [preferences, setPreferences] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<QuizLevel>(
    QuizLevel.BEGINNER
  );
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  const fetchTopics = async () => {
    try {
      const response = await axiosInstance.get(`/syllabus/${id}/topics`);
      setSyllabus(response.data);
    } catch (error) {
      console.error("Error fetching syllabus topics:", error);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [id]);

  const parseTopics = async () => {
    try {
      setModalVisible(true);
    } catch (error) {
      console.error("Error parsing topics:", error);
      Alert.alert("Error", "Failed to parse topics");
    }
  };

  const handleSubmit = async () => {
    setModalVisible(false);
    setIsParsingTopics(true);
    try {
      const response = await axiosInstance.post(
        `/syllabus/${id}/parse-topics`,
        {
          dailyMinutes: parseInt(dailyMinutes),
          preferences,
          preferredLanguage: selectedLanguage,
        }
      );
      Alert.alert("Success", "Topics parsed successfully");
      router.replace(`/syllabus/${id}`);
    } catch (error) {
      console.error("Error parsing topics:", error);
      Alert.alert("Error", "Failed to parse topics");
    } finally {
      setIsParsingTopics(false);
    }
  };

  const handleTopicPress = async (topicId: number) => {
    setSelectedTopicId(topicId);
    setQuizModalVisible(true);
  };

  const handleQuizGenerate = async () => {
    setQuizModalVisible(false);
    try {
      setIsGeneratingQuiz(true);
      const response = await axiosInstance.post(
        `/quiz/generate/${selectedTopicId}`,
        {
          level: selectedLevel,
        }
      );

      if (response.data.quizId) {
        router.push({
          pathname: "/quiz/[id]",
          params: {
            id: response.data.quizId,
            syllabusId: id,
            returnTo: "topics",
          },
        });
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      Alert.alert("Error", "Failed to generate quiz");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const renderTopicItem = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      style={styles.topicItem}
      onPress={() => handleTopicPress(item.id)}
    >
      <View style={styles.topicContent}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayText}>Day {item.dayIndex}</Text>
        </View>
        <View style={styles.topicInfo}>
          <Text style={styles.topicTitle}>{item.title}</Text>
          <Text style={styles.topicDuration}>
            {item.estimatedTimeMinutes} minutes
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: title || "Syllabus",
          headerStyle: {
            backgroundColor: "#25292e",
          },
          headerTintColor: "#fff",
        }}
      />
      <View style={styles.container}>
        {syllabus && syllabus.topics && syllabus.topics.length > 0 ? (
          <FlatList
            data={syllabus.topics}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTopicItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color="#666"
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Study Plan Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a personalized study plan from your syllabus content
            </Text>
            <TouchableOpacity style={styles.parseButton} onPress={parseTopics}>
              <Ionicons name="analytics-outline" size={20} color="white" />
              <Text style={styles.parseButtonText}>Create Study Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Study Preferences Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Study Preferences</Text>

              {/* Language Selection */}

              <TextInput
                style={styles.modalInput}
                placeholder="Daily study minutes"
                placeholderTextColor="#666"
                value={dailyMinutes}
                onChangeText={setDailyMinutes}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Study preferences (optional)"
                placeholderTextColor="#666"
                value={preferences}
                onChangeText={setPreferences}
                multiline
                textAlignVertical="top"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSubmit]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Quiz Level Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={quizModalVisible}
          onRequestClose={() => setQuizModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Select Quiz Level</Text>
              {Object.values(QuizLevel).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelOption,
                    selectedLevel === level && styles.selectedLevel,
                  ]}
                  onPress={() => setSelectedLevel(level)}
                >
                  <Text
                    style={[
                      styles.levelText,
                      selectedLevel === level && styles.selectedLevelText,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setQuizModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSubmit]}
                  onPress={handleQuizGenerate}
                >
                  <Text style={styles.buttonText}>Generate Quiz</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Loading Overlay */}
        {(isParsingTopics || isGeneratingQuiz) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>
              {isParsingTopics ? "Parsing topics..." : "Generating quiz..."}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    padding: 20,
    textAlign: "center",
  },
  topicsList: {
    padding: 20,
  },
  topicCard: {
    backgroundColor: darkTheme.colors.card,
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    marginBottom: 5,
  },
  topicDay: {
    fontSize: 14,
    color: darkTheme.colors.textSecondary,
  },
  topicTime: {
    fontSize: 12,
    color: darkTheme.colors.textSecondary,
  },
  parseButton: {
    backgroundColor: "#FFD700",
    margin: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "85%",
  },
  parseButtonDisabled: {
    opacity: 0.6,
  },
  parseButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  parseButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: darkTheme.colors.card,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: darkTheme.colors.text,
  },
  languageSection: {
    width: "100%",
    marginBottom: 20,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: darkTheme.colors.text,
    marginBottom: 12,
  },
  languageOptions: {
    flexDirection: "row",
    gap: 10,
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
  modalInput: {
    width: "100%",
    height: 40,
    backgroundColor: darkTheme.colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    color: darkTheme.colors.text,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: darkTheme.colors.error,
  },
  buttonSubmit: {
    backgroundColor: darkTheme.colors.success,
  },
  buttonText: {
    color: darkTheme.colors.text,
    textAlign: "center",
    fontWeight: "bold",
  },
  levelOption: {
    width: "100%",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: darkTheme.colors.background,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  selectedLevel: {
    backgroundColor: darkTheme.colors.primary,
    borderColor: darkTheme.colors.primary,
  },
  levelText: {
    color: darkTheme.colors.text,
    textAlign: "center",
    fontSize: 16,
  },
  selectedLevelText: {
    fontWeight: "bold",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
  },
  topicItem: {
    backgroundColor: darkTheme.colors.card,
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  topicContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayBadge: {
    backgroundColor: darkTheme.colors.primary,
    padding: 5,
    borderRadius: 5,
    marginRight: 10,
  },
  dayText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  topicInfo: {
    flex: 1,
  },

  topicDuration: {
    fontSize: 12,
    color: darkTheme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
    textAlign: "center",
  },
});
