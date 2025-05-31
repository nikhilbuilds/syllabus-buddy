import { openai } from "../config/openai";
import { LanguageCodes, LanguageCodesEnum } from "../constants/languages";

export const extractTopicsFromSyllabus = async (
  rawText: string,
  preferences: string,
  language: string
) => {
  console.log("rawText", rawText);

  const languageName = LanguageCodes[language as keyof typeof LanguageCodes];

  console.log("languageName", languageName);

  const systemPrompt = `You are a syllabus parser. Given a messy or structured syllabus, extract a list of clear and distinct topics or units suitable for creating MCQ quizzes.

${
  preferences
    ? `Use the following user preference to guide topic difficulty and depth: "${preferences}".`
    : ""
}

For each topic, also estimate the time (in minutes) it would reasonably take to understand or revise it.

${languageName ? `Provide the response in ${languageName}.` : ""}

Return only a JSON array in the exact format below:
[
  { "title": "Introduction to AI", "estimatedTime": 5 },
  { "title": "Machine Learning", "estimatedTime": 10 },
  { "title": "Deep Learning", "estimatedTime": 15 }
]`;
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: rawText },
    ],
    temperature: 0.2,
    max_tokens: 1000,
  });

  const jsonText = response.choices[0].message?.content || "[]";

  try {
    const topics = JSON.parse(jsonText);

    console.log("Parsed topics:", topics);
    return topics;
  } catch (e) {
    console.error("Invalid LLM response:", jsonText);
    throw new Error("Failed to parse topics from LLM output");
  }
};
