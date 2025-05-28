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
  const { id, syllabusId } = useLocalSearchParams();
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
        console.log("fetching quiz", id);
        const response = await axiosInstance.get(`/quiz/${id}`);
        console.log("response", response.data);

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
    fetchQuiz();
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
  const hasAnswered = selectedAnswers[currentQuestion.id] !== undefined;

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

          Alert.alert(
            response.data.message,
            `You got ${response.data.score} out of ${response.data.totalQuestions} correct!`,
            [
              {
                text: "OK",
                onPress: () =>
                  router.replace({
                    pathname: "/syllabus/[id]",
                    params: { id: Number(syllabusId) },
                  }),
              },
            ]
          );
        } catch (error) {
          console.error("Error submitting quiz:", error);
          Alert.alert("Error", "Failed to submit quiz results");
        }
      };

      submitQuiz();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowExplanation(false);
    }
  };

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
