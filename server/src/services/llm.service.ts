import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { QuizLevel } from "../constants/quiz";
import { logError, logInfo } from "../utils/logger";
import { LanguageCodes } from "../constants/languages";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

const validateQuizQuestion = (question: any): question is QuizQuestion => {
  return (
    question &&
    typeof question.question === "string" &&
    question.question.trim() !== "" &&
    question.options &&
    typeof question.options.A === "string" &&
    typeof question.options.B === "string" &&
    typeof question.options.C === "string" &&
    typeof question.options.D === "string" &&
    question.options.A.trim() !== "" &&
    question.options.B.trim() !== "" &&
    question.options.C.trim() !== "" &&
    question.options.D.trim() !== "" &&
    ["A", "B", "C", "D"].includes(question.answer) &&
    typeof question.explanation === "string" &&
    question.explanation.trim() !== ""
  );
};

interface Topic {
  title: string;
  estimatedTimeMinutes: number;
  keywords: string[];
  summary: string;
}

const validateTopic = (topic: any): topic is Topic => {
  return (
    topic &&
    typeof topic.title === "string" &&
    topic.title.trim() !== "" &&
    typeof topic.estimatedTimeMinutes === "number" &&
    Array.isArray(topic.keywords) &&
    topic.keywords.every((k: any) => typeof k === "string") &&
    typeof topic.summary === "string" &&
    topic.summary.trim() !== ""
  );
};

const generateQuizPrompt = (
  topicTitle: string,
  syllabusContext?: string,
  level?: QuizLevel,
  questionCount: number = 15,
  language?: string
) => {
  const languageName = LanguageCodes[language as keyof typeof LanguageCodes];

  return `Generate at least ${questionCount} multiple-choice questions at the **${level}** level for the topic: "${topicTitle}".

${
  syllabusContext
    ? `Use the following syllabus context if relevant:\n${syllabusContext}`
    : ""
}

IMPORTANT REQUIREMENTS:
1. Each question MUST have ALL of the following fields: question, options, answer, explanation, and level.
2. The "answer" field must be exactly one of: "A", "B", "C", or "D".
3. All options (A, B, C, D) must be filled with meaningful content.
4. The explanation must be detailed and educational.
5. Generate at least ${questionCount} questions at this level.
6. Do not leave any field empty or undefined.
7. For each level:
- BEGINNER: Questions should test basic understanding, recall of facts, and simple definitions.
- INTERMEDIATE: Questions should require understanding and application of concepts.
- ADVANCED: Questions should challenge critical thinking, analysis, and evaluation.
8. Make sure each question is unique and not simply a paraphrase of another level.

${
  language
    ? `Provide the response in ${languageName}. Only translate the question, options, and explanation — keep the JSON structure intact.`
    : ""
}

Return only a valid JSON array in the exact format below:
[
  {
    "question": "Your question here",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "answer": "A",
    "explanation": "Detailed explanation here",
  },
  ...
]

Make sure to generate at least ${questionCount} complete questions at the ${level} level with all required fields.
`;
};

const generateTopicPrompt = (
  chunk: string,
  preferences: string,
  language: string
) => {
  return `You are a syllabus parser. Given a messy or structured syllabus chunk, extract a **list of at least 12 clear and distinct topics or units** suitable for creating multiple-choice quizzes.

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
  language
    ? `Translate ALL fields — including title, keywords, and summary — into ${language}.`
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
};

const parseAndValidateQuizResponse = (content: string): QuizQuestion[] => {
  let cleanedContent = content.trim();

  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "");
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");
  }

  let quizData: any[];
  try {
    quizData = JSON.parse(cleanedContent);
  } catch (parseError) {
    logError("JSON Parse Error:", {
      error: parseError,
      content: cleanedContent,
    });
    throw new Error("Invalid JSON response from AI");
  }

  if (!Array.isArray(quizData)) {
    throw new Error("Response is not an array");
  }

  const validQuestions: QuizQuestion[] = [];
  quizData.forEach((q, i) => {
    if (validateQuizQuestion(q)) {
      validQuestions.push(q);
    } else {
      logError("Invalid question format", { index: i, question: q });
    }
  });

  return validQuestions;
};

const parseAndValidateTopicResponse = (content: string): Topic[] => {
  let cleanedContent = content.trim();

  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "");
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");
  }

  let topicData: any[];
  try {
    topicData = JSON.parse(cleanedContent);
  } catch (parseError) {
    // Try to salvage as many objects as possible
    const objects: any[] = [];
    const objectRegex = /{[\s\S]*?}/g;
    let match;
    while ((match = objectRegex.exec(cleanedContent))) {
      try {
        objects.push(JSON.parse(match[0]));
      } catch (e) {
        // skip invalid object
      }
    }
    if (objects.length === 0) {
      logError("Failed to salvage any objects from LLM output", {
        error: parseError,
        content: cleanedContent,
      });
      throw new Error("Failed to parse topics from LLM output");
    }
    topicData = objects;
  }

  if (!Array.isArray(topicData)) {
    throw new Error("Response is not an array");
  }

  const validTopics: Topic[] = [];
  topicData.forEach((t, i) => {
    if (validateTopic(t)) {
      validTopics.push(t);
    } else {
      logError("Invalid topic format", { index: i, topic: t });
    }
  });

  return validTopics;
};

const generateQuizWithOpenAI = async (
  prompt: string,
  questionCount: number
): Promise<QuizQuestion[]> => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert quiz generator. Always provide complete, valid JSON responses with all required fields filled. Never leave any field empty or undefined.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content received from OpenAI");
  }

  const questions = parseAndValidateQuizResponse(content);
  if (questions.length < questionCount * 0.7) {
    throw new Error(
      `Only generated ${questions.length}/${questionCount} valid questions.`
    );
  }
  return questions;
};

const extractTopicsWithOpenAI = async (prompt: string): Promise<Topic[]> => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a syllabus parser. Always provide complete, valid JSON responses with all required fields filled. Never leave any field empty or undefined.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_tokens: 8000,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content received from OpenAI");
  }

  return parseAndValidateTopicResponse(content);
};

const generateQuizWithGemini = async (
  prompt: string,
  questionCount: number
): Promise<QuizQuestion[]> => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text();

  if (!content) {
    throw new Error("No content received from Gemini");
  }

  const questions = parseAndValidateQuizResponse(content);
  if (questions.length < questionCount * 0.7) {
    throw new Error(
      `Only generated ${questions.length}/${questionCount} valid questions.`
    );
  }
  return questions;
};

const extractTopicsWithGemini = async (prompt: string): Promise<Topic[]> => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text();

  if (!content) {
    throw new Error("No content received from Gemini");
  }

  return parseAndValidateTopicResponse(content);
};

export const generateQuizWithFallback = async (
  topicTitle: string,
  syllabusContext?: string,
  level?: QuizLevel,
  questionCount: number = 1,
  language?: string,
  maxRetries: number = 1
): Promise<QuizQuestion[]> => {
  const prompt = generateQuizPrompt(
    topicTitle,
    syllabusContext,
    level,
    questionCount,
    language
  );
  let lastError: Error | null = null;

  // Try OpenAI with retries
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      logInfo(
        `Quiz generation attempt ${attempt}/${maxRetries + 1} with OpenAI`,
        { topicTitle, level }
      );
      const questions = await generateQuizWithOpenAI(prompt, questionCount);
      logInfo(
        `Successfully generated ${questions.length} questions with OpenAI`,
        { topicTitle, level }
      );
      return questions;
    } catch (error) {
      logError(`OpenAI attempt ${attempt} ${topicTitle} failed`, {
        error,
        topicTitle,
        level,
      });
      lastError = error as Error;
    }
  }

  // Fallback to Gemini
  try {
    logInfo(`Falling back to Gemini for quiz generation`, {
      topicTitle,
      level,
    });
    const questions = await generateQuizWithGemini(prompt, questionCount);
    logInfo(
      `Successfully generated ${questions.length} questions with Gemini`,
      { topicTitle, level }
    );
    return questions;
  } catch (error) {
    logError(`Gemini fallback failed`, { error, topicTitle, level });
    lastError = error as Error;
  }

  throw lastError || new Error("Failed to generate quiz after all fallbacks");
};

export const extractTopicsWithFallback = async (
  chunk: string,
  preferences: string,
  language: string,
  maxRetries: number = 1
): Promise<Topic[]> => {
  const prompt = generateTopicPrompt(chunk, preferences, language);
  let lastError: Error | null = null;

  // Try OpenAI with retries
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      logInfo(
        `Topic extraction attempt ${attempt}/${maxRetries + 1} with OpenAI`
      );
      const topics = await extractTopicsWithOpenAI(prompt);
      logInfo(
        `Successfully extracted ${topics.length} topics with OpenAI on attempt ${attempt}`
      );
      return topics;
    } catch (error) {
      logError(`OpenAI attempt ${attempt} for topic extraction failed`, {
        error,
      });
      lastError = error as Error;
    }
  }

  // Fallback to Gemini
  try {
    logInfo(`Falling back to Gemini for topic extraction`);
    const topics = await extractTopicsWithGemini(prompt);
    logInfo(`Successfully extracted ${topics.length} topics with Gemini`);
    return topics;
  } catch (error) {
    logError(`Gemini fallback for topic extraction failed`, { error });
    lastError = error as Error;
  }

  throw lastError || new Error("Failed to extract topics after all fallbacks");
};
