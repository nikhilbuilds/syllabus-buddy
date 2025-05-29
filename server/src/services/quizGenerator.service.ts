import { openai } from "../config/openai";
import { QuizLevel } from "../constants/quiz";
import { jsonrepair } from "jsonrepair";

// Use the following syllabus context if relevant:
// "${syllabusContext}"

export const generateQuizForTopic = async (
  topicTitle: string,
  syllabusContext?: string,
  level?: QuizLevel,
  questionCount?: number
) => {
  console.log("topicTitle", topicTitle);
  console.log("syllabusContext", syllabusContext);
  const prompt = ` Generate ${questionCount} ${
    level ? `${level.toLowerCase()}-level` : ""
  } multiple-choice questions for the topic: "${topicTitle}".
${
  syllabusContext
    ? `Use the following syllabus context if relevant:\n${syllabusContext}`
    : ""
}
Each question must have four options (A-D), one correct answer, and an explanation.

Return the output in this exact JSON format:
[
  {
    "question": "...",
    "options": {
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "..."
    },
    "answer": "A",
    "explanation": "..."
  },
  ...
]
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    temperature: 0.3,
    max_tokens: 1000,
    messages: [
      { role: "system", content: "You are an educational quiz generator." },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0].message?.content || "[]";

  try {
    return JSON.parse(content);
  } catch (err) {
    console.warn("Initial parse failed. Trying repair…");

    try {
      const fixed = jsonrepair(content);
      return JSON.parse(fixed);
    } catch (e) {
      console.error("Repair failed:", e);
      throw new Error("Failed to parse quiz from OpenAI response.");
    }
  }

  // try {
  //   console.log({ content });
  //   return JSON.parse(content);
  // } catch (err) {
  //   console.log("err", err);
  //   throw new Error("Failed to parse quiz from OpenAI response.");
  // }
};
