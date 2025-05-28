import { QuizLevel } from "../constants/quiz";

function getAvgTimePerQuestion(difficulty: QuizLevel): number {
  switch (difficulty) {
    case QuizLevel.BEGINNER:
      return 2.0;
    case QuizLevel.INTERMEDIATE:
      return 1.5;
    case QuizLevel.ADVANCED:
      return 1.0;
    default:
      return 1.5;
  }
}

export function getQuizQuestionCount(
  estimatedTime: number,
  difficulty: QuizLevel,
  maxLimit = 10
): number {
  const avgTimePerQuestion = getAvgTimePerQuestion(difficulty);
  if (estimatedTime <= 0) return 1;
  const rawCount = Math.floor(estimatedTime / avgTimePerQuestion);
  console.log("rawCount", rawCount);
  return Math.min(Math.max(rawCount, 1), maxLimit);
}
