import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import axiosInstance from "@/config/axios";
import { darkTheme } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

interface Topic {
  topicId: number;
  topicTitle: string;
  quizGenerated: boolean;
  quizId: number | null;
  quizAttempted: boolean;
  score: number | null;
  totalQuestions: number | null;
  completedOn: string | null;
  assignedDate: string;
}

interface DashboardData {
  todayIndex: number;
  totalTopics: number;
  currentStreak: number;
  completedTopics: number;
  remainingTopics: number;
  topics: Topic[];
}

interface StatsData {
  totalTopics: number;
  completedTopics: number;
  completionRate: number;
  streak: number;
  currentStreak: number;
}

interface AttemptedQuiz {
  quizId: number;
  topicId: number;
  topicTitle: string;
  score: number;
  totalQuestions: number;
  completedOn: string;
  difficulty: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
};

export default function HomeScreen() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [attemptedQuizzes, setAttemptedQuizzes] = useState<AttemptedQuiz[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const fetchData = async () => {
    try {
      const [dashboardRes, statsRes, quizzesRes] = await Promise.all([
        axiosInstance.get("/dashboard/today"),
        axiosInstance.get("/progress/stats"),
        axiosInstance.get("/dashboard/attempted-quizzes"),
      ]);

      console.log("dashboardRes", dashboardRes.data);
      console.log("statsRes", statsRes.data);
      console.log("quizzesRes", quizzesRes.data);

      setDashboard(dashboardRes.data);
      setStats(statsRes.data);
      setAttemptedQuizzes(quizzesRes.data.attemptedQuizzes);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!dashboard) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const handleQuizPress = async (quizId: number) => {
    try {
      const response = await axiosInstance.get(`/quiz/${quizId}`);
      if (response.data.quizId) {
        router.push({
          pathname: "/quiz/[id]",
          params: {
            id: response.data.quizId,
            returnTo: "home",
          },
        });
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      Alert.alert("Error", "Failed to generate quiz. Please try again.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={darkTheme.colors.text}
          colors={[darkTheme.colors.text]}
        />
      }
    >
      {dashboard.topics.length === 0 && (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome to Syllabus Buddy</Text>
          <Text style={styles.welcomeSubtitle}>
            Get started in 4 easy steps:
          </Text>

          <View style={styles.instructionContainer}>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1</Text>
              <Text style={styles.instructionText}>Go to Syllabus tab</Text>
            </View>

            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2</Text>
              <Text style={styles.instructionText}>Upload your syllabus</Text>
            </View>

            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3</Text>
              <Text style={styles.instructionText}>
                Parse topics from syllabus
              </Text>
            </View>

            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>4</Text>
              <Text style={styles.instructionText}>
                Create and attempt quizzes
              </Text>
            </View>
          </View>
        </View>
      )}
      {dashboard.topics.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.dayText}>
            {t("dashboard.day")} {dashboard.currentStreak}
          </Text>
          <Text style={styles.progressText}>
            {t("dashboard.progress")}: {stats?.completionRate}%
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${stats?.completionRate || 0}%` },
              ]}
            />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats?.currentStreak}</Text>
              <Text style={styles.statLabel}> {t("dashboard.streak")}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats?.completionRate}%</Text>
              <Text style={styles.statLabel}>
                {t("dashboard.completion_rate")}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats?.totalTopics}</Text>
              <Text style={styles.statLabel}>
                {t("dashboard.total_topics")}
              </Text>
            </View>
            {/* <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats?.completedTopics}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View> */}
          </View>
        </View>
      )}
      {dashboard.topics.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            {t("dashboard.upcoming_topics")}
          </Text>
          {dashboard.topics.map((topic) => (
            <View key={topic.topicId} style={styles.topicCard}>
              <Text style={styles.topicTitle}>{topic.topicTitle}</Text>
              <View style={styles.topicStatus}>
                <View style={styles.statusContainer}>
                  {topic.quizAttempted ? (
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreText}>
                        {t("quiz.score")}: {topic.score ?? 0}/
                        {topic.totalQuestions}
                      </Text>
                      <Text style={styles.completedText}>
                        Completed {t("dashboard.completed")}
                      </Text>
                    </View>
                  ) : topic.quizGenerated ? (
                    <Text style={styles.pendingText}>
                      {t("dashboard.quiz_ready")}
                    </Text>
                  ) : (
                    <Text style={styles.pendingText}>
                      {t("dashboard.not_started")}
                    </Text>
                  )}
                </View>
                <Text style={styles.dateText}>
                  {formatDate(topic.assignedDate)}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      {attemptedQuizzes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Attempted Quizzes</Text>
          {attemptedQuizzes.length > 0 ? (
            attemptedQuizzes.map((quiz) => (
              <View key={quiz.quizId} style={styles.quizCard}>
                <TouchableOpacity onPress={() => handleQuizPress(quiz.quizId)}>
                  <Text style={styles.quizTitle}>{quiz.topicTitle}</Text>
                  <View style={styles.quizDetails}>
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreText}>
                        Score: {quiz.score}/{quiz.totalQuestions}
                      </Text>
                      <Text style={styles.difficultyText}>
                        {quiz.difficulty}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      {formatDate(quiz.completedOn)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No quizzes attempted yet</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: darkTheme.colors.background,
  },
  statsContainer: {
    backgroundColor: darkTheme.colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dayText: {
    fontSize: 24,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    marginBottom: 24,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 14,
    color: "#6c757d",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: darkTheme.colors.text,
  },
  topicCard: {
    backgroundColor: darkTheme.colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  topicTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
  },
  topicStatus: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  statusContainer: {
    flex: 1,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    color: "#28a745",
    marginRight: 8,
  },
  completedText: {
    color: "#28a745",
    fontWeight: "500",
  },
  pendingText: {
    color: "#6c757d",
  },
  dateText: {
    color: darkTheme.colors.textSecondary,
    fontSize: 14,
    marginLeft: 16,
  },
  quizCard: {
    backgroundColor: darkTheme.colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  quizTitle: {
    fontSize: 16,
    color: darkTheme.colors.text,
    marginBottom: 8,
  },
  quizDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  difficultyText: {
    color: darkTheme.colors.textSecondary,
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    color: darkTheme.colors.textSecondary,
    marginTop: 8,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    marginVertical: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: darkTheme.colors.textSecondary,
    marginBottom: 32,
  },
  instructionContainer: {
    width: "100%",
    gap: 16,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: darkTheme.colors.card,
    padding: 16,
    borderRadius: 8,
  },
  instructionNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: darkTheme.colors.primary,
    marginRight: 12,
  },
  instructionText: {
    fontSize: 16,
    color: darkTheme.colors.text,
  },
});
