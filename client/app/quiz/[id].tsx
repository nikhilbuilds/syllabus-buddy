import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import axiosInstance from "@/config/axios";
import { darkTheme } from "@/constants/theme";

interface QuizQuestion {
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

interface Quiz {
  quizId: number;
  topicTitle: string;
  questions: QuizQuestion[];
}

export default function QuizScreen() {
  const { id, syllabusId, returnTo } = useLocalSearchParams<{
    id: string;
    syllabusId?: string;
    returnTo?: string;
  }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axiosInstance.get(`/quiz/${id}`);

        if (response.data.attempted) {
          Alert.alert(response.data.message, "", [
            {
              text: "OK",
              onPress: () => {
                // Replace instead of push to prevent going back to quiz
                router.replace({
                  pathname: "/syllabus/[id]",
                  params: { id: Number(syllabusId) },
                });
              },
            },
          ]);
          return; // Don't set quiz data if already attempted
        }

        setQuiz(response.data);
      } catch (error) {
        console.error("Error fetching quiz:", error);
        Alert.alert("Error", "Failed to load quiz", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    };
    if (id) fetchQuiz();
  }, [id]);

  if (!quiz) {
    return (
      <View style={styles.container}>
        <Text>Loading quiz...</Text>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasAnswered = selectedAnswers[currentQuestion?.id] !== undefined;

  const handleAnswer = (answer: string) => {
    if (hasAnswered) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const submitQuiz = async () => {
        try {
          const response = await axiosInstance.post(`/progress/submit/${id}`, {
            answers: selectedAnswers,
          });

          if (returnTo === "home") {
            router.replace("/(tabs)");
          } else if (returnTo === "topics") {
            router.replace(`/syllabus/${syllabusId}`);
          }

          Alert.alert(
            "Quiz Completed",
            `Your score: ${response.data.score}/${response.data.totalQuestions}`
          );
        } catch (error) {
          console.error("Error submitting quiz:", error);
          Alert.alert("Error", "Failed to submit quiz");
        }
      };
      submitQuiz();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowExplanation(false);
    }
  };

  if (quiz.questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No questions available for this quiz.</Text>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => {
            if (returnTo === "home") {
              router.replace("/(tabs)");
            } else if (returnTo === "topics") {
              router.replace(`/syllabus/${syllabusId}`);
            }
          }}
        >
          <Text style={styles.nextButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: quiz.topicTitle,
          headerStyle: {
            backgroundColor: "#25292e",
          },
          headerTintColor: "#fff",
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Text>
        </View>

        <Text style={styles.question}>{currentQuestion.question}</Text>

        {Object.entries(currentQuestion.options).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.option,
              hasAnswered &&
                key === currentQuestion.answer &&
                styles.correctOption,
              hasAnswered &&
                key === selectedAnswers[currentQuestion.id] &&
                key !== currentQuestion.answer &&
                styles.wrongOption,
            ]}
            onPress={() => handleAnswer(key)}
            disabled={hasAnswered}
          >
            <Text style={styles.optionText}>
              {key}. {value}
            </Text>
          </TouchableOpacity>
        ))}

        {showExplanation && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationText}>
              {currentQuestion.explanation}
            </Text>
          </View>
        )}

        {hasAnswered && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? "Finish Quiz" : "Next Question"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: darkTheme.colors.background,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: "#666",
  },
  question: {
    fontSize: 18,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    marginBottom: 20,
  },
  option: {
    backgroundColor: darkTheme.colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionText: {
    color: darkTheme.colors.text,
  },
  correctOption: {
    backgroundColor: darkTheme.colors.success + "33",
  },
  wrongOption: {
    backgroundColor: darkTheme.colors.error + "33",
  },
  explanationContainer: {
    backgroundColor: "#e8f4f8",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  explanationText: {
    fontSize: 14,
    color: "#2c5282",
  },
  nextButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
