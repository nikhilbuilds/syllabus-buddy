import OpenAI from "openai";
import { QuizLevel } from "../constants/quiz";
import { LanguageCodes } from "../constants/languages";
// Use the following syllabus context if relevant:
// "${syllabusContext}"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export const generateQuiz = async (
  topicTitle: string,
  syllabusContext?: string,
  level?: QuizLevel,
  questionCount: number = 5,
  language?: string
): Promise<QuizQuestion[]> => {
  const languageName = LanguageCodes[language as keyof typeof LanguageCodes];

  const prompt = `Generate exactly ${questionCount} ${
    level ? `${level.toLowerCase()}-level` : ""
  } multiple-choice questions for the topic: "${topicTitle}".
  
  ${
    syllabusContext
      ? `Use the following syllabus context if relevant:\n${syllabusContext}`
      : ""
  }
  
  IMPORTANT REQUIREMENTS:
  1. Each question MUST have ALL four fields: question, options, answer, explanation
  2. The "answer" field must be exactly one of: "A", "B", "C", or "D"
  3. All options (A, B, C, D) must be filled with meaningful content
  4. The explanation must be detailed and educational
  5. Do not leave any field empty or undefined
  
  ${
    language
      ? `Provide the response in ${languageName}. Only translate the question, options, and explanation — keep the JSON structure intact.`
      : ""
  }
  
  Return only a valid JSON array in this exact format:
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
      "explanation": "Detailed explanation here"
    }
  ]
  
  Make sure to generate exactly ${questionCount} complete questions with all required fields.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // Clean the response to extract JSON
    let cleanedContent = content.trim();

    // Remove markdown code blocks if present
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
      console.error("JSON Parse Error:", parseError);
      console.error("Content that failed to parse:", cleanedContent);
      throw new Error("Invalid JSON response from AI");
    }

    if (!Array.isArray(quizData)) {
      throw new Error("Response is not an array");
    }

    // Validate and filter questions
    const validQuestions: QuizQuestion[] = [];
    const invalidQuestions: any[] = [];

    for (let i = 0; i < quizData.length; i++) {
      const question = quizData[i];
      if (validateQuizQuestion(question)) {
        validQuestions.push(question);
      } else {
        console.warn(`Invalid question at index ${i}:`, question);
        invalidQuestions.push({ index: i, question });
      }
    }

    // Log validation results
    console.log(
      `Generated ${quizData.length} questions, ${validQuestions.length} valid, ${invalidQuestions.length} invalid`
    );

    if (invalidQuestions.length > 0) {
      console.warn("Invalid questions found:", invalidQuestions);
    }

    // If we don't have enough valid questions, try to regenerate the invalid ones
    if (validQuestions.length < questionCount && invalidQuestions.length > 0) {
      console.log(
        `Attempting to regenerate ${invalidQuestions.length} invalid questions...`
      );

      // For now, we'll work with what we have
      // In a production environment, you might want to retry generation
    }

    if (validQuestions.length === 0) {
      throw new Error("No valid questions generated");
    }

    return validQuestions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
};

export const generateQuizWithRetry = async (
  topicTitle: string,
  syllabusContext?: string,
  level?: QuizLevel,
  questionCount: number = 5,
  language?: string,
  maxRetries: number = 2
): Promise<QuizQuestion[]> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Quiz generation attempt ${attempt}/${maxRetries} for topic: ${topicTitle}`
      );

      const questions = await generateQuiz(
        topicTitle,
        syllabusContext,
        level,
        questionCount,
        language
      );

      // If we got at least 70% of requested questions, consider it successful
      const minAcceptableQuestions = Math.ceil(questionCount * 0.7);

      if (questions.length >= minAcceptableQuestions) {
        console.log(
          `Successfully generated ${questions.length}/${questionCount} questions on attempt ${attempt}`
        );
        return questions;
      } else {
        throw new Error(
          `Only generated ${questions.length}/${questionCount} valid questions`
        );
      }
    } catch (error) {
      console.error(`Quiz generation attempt ${attempt} failed:`, error);
      lastError = error as Error;

      if (attempt < maxRetries) {
        console.log(`Retrying quiz generation in 1 second...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError || new Error("Failed to generate quiz after all retries");
};
