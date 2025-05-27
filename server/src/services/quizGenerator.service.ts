import { openai } from "../config/openai";

// Use the following syllabus context if relevant:
// "${syllabusContext}"

export const generateQuizForTopic = async (
  topicTitle: string,
  syllabusContext?: string
) => {
  console.log("topicTitle", topicTitle);
  console.log("syllabusContext", syllabusContext);
  const prompt = `
Generate 3 multiple-choice questions for the topic: "${topicTitle}".

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
    console.log({ content });
    return JSON.parse(content);
  } catch (err) {
    console.log("err", err);
    throw new Error("Failed to parse quiz from OpenAI response.");
  }
};
