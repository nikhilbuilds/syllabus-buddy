import { QuizLevel } from "../constants/quiz";
import { generateQuizWithFallback as generate } from "./llm.service";

interface QuizQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: "A" | "B" | "C" | "D";
  explanation: string;
}

export const generateQuizWithRetry = async (
  topicTitle: string,
  syllabusContext?: string,
  level?: QuizLevel,
  questionCount: number = 1,
  language?: string,
  maxRetries: number = 1
): Promise<QuizQuestion[]> => {
  return generate(
    topicTitle,
    syllabusContext,
    level,
    questionCount,
    language,
    maxRetries
  );
};
