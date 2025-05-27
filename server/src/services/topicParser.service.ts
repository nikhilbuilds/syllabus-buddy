import { openai } from "../config/openai";

export const extractTopicsFromSyllabus = async (rawText: string) => {
  console.log("rawText", rawText);
  const systemPrompt = `You are a syllabus parser. Given a messy or structured syllabus, extract a list of clear topics or units. Respond only in JSON format like:
[
  { "title": "Introduction to AI" },
  { "title": "Machine Learning" },
  { "title": "Deep Learning" }
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
