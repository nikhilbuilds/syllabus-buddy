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
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import axiosInstance from "@/config/axios";

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

  const handleParseTopics = async () => {
    try {
      setIsParsingTopics(true);
      await axiosInstance.post(`/syllabus/${id}/parse-topics`);
      console.log({ id });
      await fetchTopics(); // Refresh topics after parsing
    } catch (error) {
      console.error("Error parsing topics:", error);
    } finally {
      setIsParsingTopics(false);
    }
  };

  const handleTopicPress = async (topicId: number) => {
    try {
      setIsGeneratingQuiz(true);
      const response = await axiosInstance.post(`/quiz/generate/${topicId}`);

      if (response.data.quizId) {
        router.push({
          pathname: "/quiz/[id]",
          params: { id: topicId, syllabusId: id },
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
              backgroundColor: "#25292e",
            },
            headerTintColor: "#fff",
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
            backgroundColor: "#25292e",
          },
          headerTintColor: "#fff",
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
          onPress={handleParseTopics}
          disabled={isParsingTopics}
        >
          <Text style={styles.parseButtonText}>
            {isParsingTopics ? "Parsing Topics..." : "Parse Topics"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  topicsList: {
    flex: 1,
    marginBottom: 16,
  },
  topicItem: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  topicDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topicInfo: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 24,
  },
  parseButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  parseButtonDisabled: {
    backgroundColor: "#999",
  },
  parseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#007AFF",
  },
});
