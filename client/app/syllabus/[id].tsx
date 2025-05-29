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

export default function SyllabusDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [syllabus, setSyllabus] = useState<SyllabusDetail | null>(null);
  const [isParsingTopics, setIsParsingTopics] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [dailyMinutes, setDailyMinutes] = useState("");
  const [preferences, setPreferences] = useState("");
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<QuizLevel>(
    QuizLevel.BEGINNER
  );
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  const fetchTopics = async () => {
    try {
      const response = await axiosInstance.get(`/syllabus/${id}/topics`);
      console.log(response.data);
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
      Alert.alert("Error", "Failed to generate quiz. Please try again.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  if (!syllabus) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Topics",
            headerStyle: {
              backgroundColor: darkTheme.colors.card,
            },
            headerTintColor: darkTheme.colors.text,
          }}
        />
        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Topics",
          headerStyle: {
            backgroundColor: darkTheme.colors.card,
          },
          headerTintColor: darkTheme.colors.text,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>{syllabus.title}</Text>

        <FlatList
          data={syllabus.topics}
          style={styles.topicsList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.topicItem}
              onPress={() => handleTopicPress(item.id)}
              disabled={isGeneratingQuiz}
            >
              <Text style={styles.topicTitle}>{item.title}</Text>
              <View style={styles.topicDetails}>
                <Text style={styles.topicInfo}>Day {item.dayIndex}</Text>
                <Text style={styles.topicInfo}>
                  {item.estimatedTimeMinutes} mins
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No topics available</Text>
          }
        />

        {isGeneratingQuiz && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Generating Quiz...</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.parseButton,
            isParsingTopics && styles.parseButtonDisabled,
          ]}
          onPress={parseTopics}
          disabled={isParsingTopics}
        >
          <View style={styles.parseButtonContent}>
            <Ionicons name="git-branch-outline" size={24} color="#000" />
            <Text style={styles.parseButtonText}>
              {isParsingTopics ? "Parsing Topics..." : "Parse Topics"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Study Preferences</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Daily minutes (e.g., 15)"
              placeholderTextColor="#666"
              value={dailyMinutes}
              onChangeText={setDailyMinutes}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.modalInput, { height: 100 }]}
              placeholder="Any specific preferences?"
              placeholderTextColor="#666"
              value={preferences}
              onChangeText={setPreferences}
              multiline
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
                  {level}
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
    </>
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
    marginBottom: 12,
    color: darkTheme.colors.text,
  },
  topicsList: {
    flex: 1,
    marginBottom: 16,
  },
  topicItem: {
    backgroundColor: darkTheme.colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: darkTheme.colors.text,
  },
  topicDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topicInfo: {
    fontSize: 14,
    color: darkTheme.colors.textSecondary,
  },
  emptyText: {
    textAlign: "center",
    color: darkTheme.colors.textSecondary,
    marginTop: 24,
  },
  parseButton: {
    backgroundColor: "#ffd33d",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#ffd33d",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  parseButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  parseButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  parseButtonDisabled: {
    backgroundColor: "#ffd33d80",
    shadowOpacity: 0.1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${darkTheme.colors.background}CC`,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: darkTheme.colors.primary,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    backgroundColor: darkTheme.colors.card,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: darkTheme.colors.text,
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
});
