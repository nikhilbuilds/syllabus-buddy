import { z } from "zod";
import { QuizQuestion as QuizQuestionType } from "../services/llm.service";

export const quizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
    D: z.string().min(1),
  }),
  answer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().min(1),
});

export const quizArraySchema = z.array(quizQuestionSchema);

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
