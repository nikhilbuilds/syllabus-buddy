import { openai } from "../config/openai";
import { LanguageCodes } from "../constants/languages";

const CHUNK_SIZE = 3000; // 3k characters is safe

function bestEffortParseJsonArray(raw: string): any[] {
  let cleaned = raw
    .replace(/```json|```/g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) throw new Error("No JSON array found in LLM output");
  cleaned = arrayMatch[0];

  // Remove trailing commas
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  // Try normal parse first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to salvage as many objects as possible
    const objects: any[] = [];
    const objectRegex = /{[\s\S]*?}/g;
    let match;
    while ((match = objectRegex.exec(cleaned))) {
      try {
        objects.push(JSON.parse(match[0]));
      } catch (e) {
        // skip invalid object
      }
    }
    if (objects.length === 0) {
      console.error("Failed to salvage any objects from LLM output");
      throw new Error("Failed to parse topics from LLM output");
    }
    return objects;
  }
}

export const extractTopicsFromSyllabus = async (
  rawText: string,
  preferences: string,
  language: string
) => {
  try {
    console.log("rawText length:", rawText.length);

    const languageName = LanguageCodes[language as keyof typeof LanguageCodes];
    console.log("languageName:", languageName);

    // 1️⃣ Split rawText into chunks
    const chunks: string[] = [];
    for (let i = 0; i < rawText.length; i += CHUNK_SIZE) {
      chunks.push(rawText.slice(i, i + CHUNK_SIZE));
    }

    console.log("Number of chunks:", chunks.length);

    const allTopics: any[] = [];

    // 2️⃣ Process each chunk individually
    for (const [index, chunk] of chunks.entries()) {
      console.log(`Processing chunk ${index + 1}/${chunks.length}`);

      const systemPrompt = `You are a syllabus parser. Given a messy or structured syllabus chunk, extract a **list of at least 12 clear and distinct topics or units** suitable for creating multiple-choice quizzes.

  ${
    preferences
      ? `Use the following user preference to guide topic difficulty and depth: "${preferences}".`
      : ""
  }

For each topic:
- Provide the topic **title** (string).
- Estimate the time (in minutes) it would reasonably take to understand or revise it (**integer between 15 and 120**).
- Generate a **list of relevant keywords** that would help design high-quality quiz questions (3 to 5 keywords per topic).
- Generate a **concise yet detailed summary** (minimum 100 words, maximum 400 words) that effectively explains the key points of the topic. Take your time to ensure the summary is clear and informative.

${
  languageName
    ? `Translate ALL fields — including title, keywords, and summary — into ${languageName}.`
    : ""
}

Return only a valid JSON array in the exact format below:
[
  { 
    "title": "Introduction to AI", 
    "estimatedTimeMinutes": 45, 
    "keywords": ["artificial intelligence", "history", "applications"],
    "summary": "A detailed yet concise explanation about the basics of AI, including its history, real-world applications, key concepts, and the ethical considerations surrounding its use. This summary provides a foundational understanding for learners to grasp how AI influences modern technology, industry practices, and our daily lives. It also outlines major milestones in AI development and discusses various subfields like machine learning, neural networks, and natural language processing. Finally, it touches on the challenges and opportunities AI brings to society and the workforce. (minimum 100 words, maximum 400 words)."
  },
  ...
]

Important:
- Return only valid JSON.
- Do not include any explanations, notes, or markdown — just the JSON.
- Ensure at least 12 topics are extracted.
- Make sure every topic includes all required fields with consistent formatting.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", //"gpt-4o-mini"
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: chunk },
        ],
        temperature: 0.2,
        max_tokens: 8000,
      });

      const jsonText = response.choices[0].message?.content || "[]";

      try {
        const topics = bestEffortParseJsonArray(jsonText);
        console.log(`Chunk ${index + 1} parsed topics:`, topics);
        allTopics.push(...topics);
      } catch (e) {
        console.error(`Chunk ${index + 1} error:`, jsonText);
        throw new Error(
          `Failed to parse topics from LLM output in chunk ${index + 1}`
        );
      }
    }

    console.log("Total topics parsed:", allTopics.length);
    return allTopics;
  } catch (error) {
    console.error("Error in extractTopicsFromSyllabus:", error);
  }
};
