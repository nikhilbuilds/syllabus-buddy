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

interface QuizUserProgress {
  id: number;
  score: number;
  completedOn: string;
}

interface Quiz {
  id: number;
  level: string;
  totalQuestions: number;
  version: number;
  userProgress: QuizUserProgress[];
}

interface Topic {
  id: number;
  title: string;
  dayIndex: number;
  estimatedTimeMinutes: number;
  quizzes: Quiz[];
}

interface SyllabusDetail {
  id: number;
  title: string;
  topics: Topic[];
  status: "pending" | "completed" | "failed";
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

type MaybeTopic = Topic | null | undefined;

const ProcessingState = ({
  state,
  label,
}: {
  state: boolean;
  label: string;
}) => (
  <View style={styles.processingItem}>
    <View style={styles.processingIconContainer}>
      {state ? (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={darkTheme.colors.success}
        />
      ) : (
        <ActivityIndicator size="small" color={darkTheme.colors.primary} />
      )}
    </View>
    <Text style={styles.processingText}>{label}</Text>
  </View>
);

const SkeletonLoader = () => (
  <View style={styles.skeletonContainer}>
    {/* Header Skeleton */}
    <View style={styles.skeletonHeader}>
      <View style={styles.skeletonTitle} />
    </View>

    {/* Processing Status Skeleton */}
    <View style={styles.skeletonProcessingContainer}>
      <View style={styles.skeletonProcessingHeader}>
        <View style={styles.skeletonProcessingTitle} />
      </View>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.skeletonProcessingItem}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonText} />
        </View>
      ))}
    </View>

    {/* Topics List Skeleton */}
    <View style={styles.skeletonTopicsContainer}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
        <View key={item} style={styles.skeletonTopicItem}>
          <View style={styles.skeletonTopicContent}>
            <View style={styles.skeletonDayBadge} />
            <View style={styles.skeletonTopicInfo}>
              <View style={styles.skeletonTopicTitle} />
              <View style={styles.skeletonTopicDuration} />
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>
);

export default function SyllabusDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syllabus, setSyllabus] = useState<any | null>(null);
  const [topics, setTopics] = useState<SyllabusDetail | null>(null);
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
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isProcessingExpanded, setIsProcessingExpanded] = useState(true);
  const [levelSelectModalVisible, setLevelSelectModalVisible] = useState(false);
  const [generateQuizModalVisible, setGenerateQuizModalVisible] =
    useState(false);
  const [isGeneratingNewQuiz, setIsGeneratingNewQuiz] = useState(false);

  const fetchSyllabus = async () => {
    try {
      const response = await axiosInstance.get(`/syllabus/${id}`);
      if (response.data.processingState.topicsSaved) {
        setIsProcessingExpanded(false);
      }
      setSyllabus(response.data);
    } catch (error) {
      console.error("Error fetching syllabus:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await axiosInstance.get(`/syllabus/${id}/topics`);
      setTopics(response.data);
    } catch (error) {
      console.error("Error fetching syllabus topics:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSyllabus(), fetchTopics()]);
      setLoading(false);
    };
    loadData();
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
    }
  };

  const handleTopicPress = (topic: Topic) => {
    setSelectedTopicId(topic.id);
    setSelectedTopic(topic);
    if (allLevelsPlayed(topic)) {
      setQuizModalVisible(true);
    } else {
      setLevelSelectModalVisible(true);
    }
  };

  const handleQuizRedirect = async () => {
    try {
      setIsGeneratingQuiz(true);

      const topic = topics?.topics.find((t) => t.id === selectedTopicId);
      const quiz = topic?.quizzes.find((q) => q.level === selectedLevel);

      if (quiz) {
        router.replace({
          pathname: "/quiz/[id]",
          params: {
            id: quiz.id,
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

  const handleQuizGenerate = async () => {
    setIsGeneratingNewQuiz(true);
    try {
      const response = await axiosInstance.post(
        `/quiz/${selectedTopic?.id}/regenerate-quiz`,
        {
          level: selectedLevel,
        }
      );

      console.log("response", JSON.stringify(response.data));

      if (response.data.quizId) {
        router.replace({
          pathname: "/quiz/[id]",
          params: {
            id: response.data.quizId,
            syllabusId: id,
            returnTo: "topics",
          },
        });
      }

      Alert.alert("Success", "Quiz generated successfully");
      // router.replace(`/syllabus/${id}`);
    } catch (error) {
      console.log("error", JSON.stringify(error));
      console.error("Error parsing topics:", error);
      Alert.alert("Error", "Failed to parse topics");
    } finally {
      setIsGeneratingNewQuiz(false);
    }
  };

  const renderTopicItem = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      style={styles.topicItem}
      onPress={() => handleTopicPress(item)}
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

  const renderEmptyState = () => {
    if (topics?.status === "pending") {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.emptyTitle}>Processing Your Syllabus</Text>
          <Text style={styles.emptySubtitle}>
            We're analyzing your syllabus and creating a personalized study
            plan. This may take a few minutes.
          </Text>
        </View>
      );
    }

    if (topics?.status === "failed") {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color="#FF3B30"
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>Processing Failed</Text>
          <Text style={styles.emptySubtitle}>
            We encountered an error while processing your syllabus. Please try
            again later.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="document-text-outline"
          size={64}
          color="#666"
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>No Study Plan Yet</Text>
        <Text style={styles.emptySubtitle}>
          Your study plan is being prepared. Please check back in a few minutes.
        </Text>
      </View>
    );
  };

  const allLevelsPlayed = (topic: Topic | null) => {
    if (!topic) return false;
    const requiredLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
    return requiredLevels.every((level) => {
      const quiz = topic.quizzes.find((q) => q.level.toUpperCase() === level);
      return quiz && quiz.userProgress && quiz.userProgress.length > 0;
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Loading...",
            headerStyle: {
              backgroundColor: "#25292e",
            },
            headerTintColor: "#fff",
          }}
        />
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: syllabus?.title || "Syllabus",
          headerStyle: {
            backgroundColor: "#25292e",
          },
          headerTintColor: "#fff",
        }}
      />

      <TouchableOpacity
        style={styles.processingHeader}
        onPress={() => setIsProcessingExpanded(!isProcessingExpanded)}
      >
        <View style={styles.processingHeaderContent}>
          <Text style={styles.processingTitle}> Status</Text>
          <Ionicons
            name={isProcessingExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={darkTheme.colors.text}
          />
        </View>
      </TouchableOpacity>

      {isProcessingExpanded && (
        <View style={styles.processingContainer}>
          <ProcessingState
            state={!!syllabus?.processingState?.topicsSaved}
            label="Creating Study Plan"
          />
          <ProcessingState
            state={!!syllabus?.processingState?.beginnerQuizSaved}
            label="Generating Beginner Quizzes"
          />
          <ProcessingState
            state={!!syllabus?.processingState?.intermediateQuizSaved}
            label="Generating Intermediate Quizzes"
          />
          <ProcessingState
            state={!!syllabus?.processingState?.advancedQuizSaved}
            label="Generating Advanced Quizzes"
          />
        </View>
      )}

      <View style={styles.container}>
        {topics && topics.topics && topics.topics.length > 0 ? (
          <FlatList
            data={topics.topics}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTopicItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmptyState()
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
          visible={levelSelectModalVisible}
          onRequestClose={() => setLevelSelectModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Select Quiz Level</Text>
              {Object.values(QuizLevel).map((level) => {
                const quiz = selectedTopic?.quizzes.find(
                  (q) => q.level === level
                );
                const isDisabled = !quiz;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelOption,
                      selectedLevel === level && styles.selectedLevel,
                      isDisabled && styles.disabledLevel,
                    ]}
                    disabled={isDisabled}
                    onPress={() => {
                      setSelectedLevel(level);
                    }}
                  >
                    <Text
                      style={[
                        styles.levelText,
                        selectedLevel === level && styles.selectedLevelText,
                        isDisabled && styles.disabledLevelText,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() +
                        level.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => handleQuizRedirect()}
              >
                <Text style={styles.generateNewButtonText}>Play Quiz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setLevelSelectModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionDivider} />
            <Text style={styles.modalSubtitle}>
              Play all quiz to show history and create new quizzes
            </Text>
          </View>
        </Modal>

        {/* Quiz History Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={quizModalVisible}
          onRequestClose={() => setQuizModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View
              style={[
                styles.modalView,
                {
                  maxHeight: "92%",
                  paddingVertical: 24,
                  paddingHorizontal: 16,
                },
              ]}
            >
              <Text style={styles.modalTitle}>Quiz History</Text>
              {selectedTopic &&
              selectedTopic.quizzes &&
              selectedTopic.quizzes.length > 0 ? (
                <View style={styles.quizTableContainer}>
                  <View style={styles.quizTableHeader}>
                    <Text style={styles.quizTableHeaderCell}>Level</Text>
                    <Text style={styles.quizTableHeaderCell}>Date</Text>
                    <Text style={styles.quizTableHeaderCell}>Version</Text>
                    <Text style={styles.quizTableHeaderCell}>Play</Text>
                  </View>
                  <ScrollView style={styles.quizTableBody}>
                    {selectedTopic.quizzes
                      .filter(
                        (quiz: Quiz) =>
                          quiz.userProgress && quiz.userProgress.length > 0
                      )
                      .map((quiz: Quiz, idx: number) => {
                        // Get the latest completedOn date from userProgress
                        const latestProgress = quiz.userProgress.reduce(
                          (
                            latest: QuizUserProgress | null,
                            curr: QuizUserProgress
                          ) => {
                            return !latest ||
                              new Date(curr.completedOn) >
                                new Date(latest.completedOn)
                              ? curr
                              : latest;
                          },
                          null
                        );
                        return (
                          <View key={quiz.id} style={styles.quizTableRow}>
                            <Text style={styles.quizTableCell}>
                              {quiz.level.charAt(0).toUpperCase() +
                                quiz.level.slice(1).toLowerCase()}
                            </Text>
                            <Text style={styles.quizTableCell}>
                              {latestProgress
                                ? new Date(
                                    latestProgress.completedOn
                                  ).toLocaleDateString()
                                : "-"}
                            </Text>
                            <Text style={styles.quizTableCell}>
                              v{quiz.version}
                            </Text>
                            <TouchableOpacity
                              style={styles.playButton}
                              onPress={() => {
                                setSelectedLevel(quiz.level as QuizLevel);
                                handleQuizRedirect();
                              }}
                            >
                              <Ionicons name="play" size={16} color="white" />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.noQuizzesContainer}>
                  <Ionicons
                    name="document-text-outline"
                    size={48}
                    color={darkTheme.colors.textSecondary}
                  />
                  <Text style={styles.noQuizzesText}>
                    No quizzes available yet
                  </Text>
                </View>
              )}
              <View style={styles.sectionDivider} />
              {allLevelsPlayed(selectedTopic) && (
                <TouchableOpacity
                  style={styles.generateNewButton}
                  onPress={() => {
                    setGenerateQuizModalVisible(true);
                    setQuizModalVisible(false);
                  }}
                >
                  <Text style={styles.generateNewButtonText}>
                    Generate New Quiz
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setQuizModalVisible(false);
                  setGenerateQuizModalVisible(false);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Generate New Quiz Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={generateQuizModalVisible}
          onRequestClose={() => setGenerateQuizModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Generate New Quiz</Text>
              {Object.values(QuizLevel).map((level) => {
                const quiz = selectedTopic?.quizzes.find(
                  (q) => q.level === level
                );
                const isDisabled = !quiz;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.levelOption,
                      selectedLevel === level && styles.selectedLevel,
                      isDisabled && styles.disabledLevel,
                    ]}
                    disabled={isDisabled}
                    onPress={() => {
                      setSelectedLevel(level);
                    }}
                  >
                    <Text
                      style={[
                        styles.levelText,
                        selectedLevel === level && styles.selectedLevelText,
                        isDisabled && styles.disabledLevelText,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() +
                        level.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => handleQuizGenerate()}
                disabled={isGeneratingNewQuiz}
              >
                {isGeneratingNewQuiz ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.generateNewButtonText}>
                    Generate Quiz
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setQuizModalVisible(false);
                  setGenerateQuizModalVisible(false);
                }}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Loading Overlay */}
        {isGeneratingQuiz && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Generating quiz...</Text>
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
    alignItems: "center",
    justifyContent: "center",
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
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  disabledLevel: {
    backgroundColor: darkTheme.colors.background,
    borderColor: darkTheme.colors.border,
    opacity: 0.5,
  },
  disabledLevelText: {
    color: darkTheme.colors.textSecondary,
  },
  processingHeader: {
    backgroundColor: darkTheme.colors.card,
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  processingHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: darkTheme.colors.text,
  },
  processingContainer: {
    backgroundColor: darkTheme.colors.card,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: darkTheme.colors.border,
  },
  processingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  processingIconContainer: {
    width: 24,
    marginRight: 12,
  },
  processingText: {
    fontSize: 14,
    color: darkTheme.colors.text,
    flex: 1,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  skeletonHeader: {
    padding: 20,
    backgroundColor: darkTheme.colors.card,
  },
  skeletonTitle: {
    height: 24,
    width: "60%",
    backgroundColor: darkTheme.colors.border,
    borderRadius: 4,
  },
  skeletonProcessingContainer: {
    margin: 15,
    backgroundColor: darkTheme.colors.card,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  skeletonProcessingHeader: {
    marginBottom: 15,
  },
  skeletonProcessingTitle: {
    height: 20,
    width: "40%",
    backgroundColor: darkTheme.colors.border,
    borderRadius: 4,
  },
  skeletonProcessingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.border,
    marginRight: 12,
  },
  skeletonText: {
    height: 16,
    flex: 1,
    backgroundColor: darkTheme.colors.border,
    borderRadius: 4,
  },
  skeletonTopicsContainer: {
    padding: 20,
  },
  skeletonTopicItem: {
    backgroundColor: darkTheme.colors.card,
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  skeletonTopicContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonDayBadge: {
    width: 60,
    height: 24,
    backgroundColor: darkTheme.colors.border,
    borderRadius: 4,
    marginRight: 10,
  },
  skeletonTopicInfo: {
    flex: 1,
  },
  skeletonTopicTitle: {
    height: 16,
    width: "80%",
    backgroundColor: darkTheme.colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTopicDuration: {
    height: 14,
    width: "40%",
    backgroundColor: darkTheme.colors.border,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    marginBottom: 12,
  },
  quizTableContainer: {
    width: "100%",
    marginBottom: 12,
  },
  quizTableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
    paddingBottom: 8,
    marginBottom: 4,
  },
  quizTableHeaderCell: {
    flex: 1,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    fontSize: 14,
    textAlign: "center",
  },
  quizTableBody: {
    maxHeight: 180,
  },
  quizTableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  quizTableCell: {
    flex: 1,
    color: darkTheme.colors.text,
    fontSize: 14,
    textAlign: "center",
  },
  playButton: {
    backgroundColor: darkTheme.colors.success,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  playButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  generateNewButton: {
    backgroundColor: darkTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    width: "100%",
    alignSelf: "center",
  },
  generateNewButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
  noQuizzesContainer: {
    alignItems: "center",
    padding: 20,
  },
  noQuizzesText: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
    marginVertical: 16,
    textAlign: "center",
  },
  generateButton: {
    backgroundColor: darkTheme.colors.primary,
    marginTop: 20,
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalSubtitle: {
    fontSize: 14,
    color: darkTheme.colors.textSecondary,
    marginBottom: 20,
    textAlign: "center",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: darkTheme.colors.border,
    marginVertical: 12,
    width: "100%",
  },
  closeButton: {
    backgroundColor: darkTheme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 0,
    marginBottom: 8,
    width: "100%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  closeButtonText: {
    color: darkTheme.colors.text,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});
