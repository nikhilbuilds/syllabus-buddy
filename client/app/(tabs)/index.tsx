import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import axiosInstance from "@/config/axios";
import { darkTheme } from "@/constants/theme";

interface Topic {
  topicId: number;
  topicTitle: string;
  quizGenerated: boolean;
  quizId: number | null;
  quizAttempted: boolean;
  score: number | null;
  totalQuestions: number | null;
  completedOn: string | null;
}

interface DashboardData {
  todayIndex: number;
  totalTopics: number;
  completedTopics: number;
  remainingTopics: number;
  topics: Topic[];
}

export default function HomeScreen() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axiosInstance.get("/dashboard/today");
        setDashboard(response.data);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      }
    };

    fetchDashboard();
  }, []);

  if (!dashboard) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const completionPercentage = Math.round(
    (dashboard.completedTopics / dashboard.totalTopics) * 100
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.dayText}>Day {dashboard.todayIndex}</Text>
        <Text style={styles.progressText}>
          Progress: {completionPercentage}%
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${completionPercentage}%` }]}
          />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{dashboard.totalTopics}</Text>
            <Text style={styles.statLabel}>Total Topics</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{dashboard.completedTopics}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{dashboard.remainingTopics}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Today's Topics</Text>
      {dashboard.topics.map((topic) => (
        <View key={topic.topicId} style={styles.topicCard}>
          <Text style={styles.topicTitle}>{topic.topicTitle}</Text>
          <View style={styles.topicStatus}>
            {topic.quizAttempted ? (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  Score: {topic.score ?? 0}/{topic.totalQuestions}
                </Text>
                <Text style={styles.completedText}>Completed</Text>
              </View>
            ) : topic.quizGenerated ? (
              <Text style={styles.pendingText}>Quiz Ready</Text>
            ) : (
              <Text style={styles.pendingText}>Not Started</Text>
            )}
          </View>
        </View>
      ))}
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
  },
  progressText: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
});
