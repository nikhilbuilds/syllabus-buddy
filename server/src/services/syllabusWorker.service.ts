import fs from "fs";
import pdfParse from "pdf-parse";
import { AppDataSource } from "../db/data-source";
import { Syllabus, SyllabusStatus } from "../models/Syllabus";
import { Topic } from "../models/Topic";
import { Quiz } from "../models/Quiz";
import { QuizQuestion } from "../models/QuizQuestion";
import { QuizLevel } from "../constants/quiz";
import { openai } from "../config/openai";
import { PushNotificationService } from "./pushNotification.service";
import { EmailService } from "./email.service";
import { User } from "../models/User";
import { TextChunkingService, TextChunk } from "./textChunking.service";
import { extractTopicsFromSyllabus } from "./topicParser.service";
import { scheduleTopicsByDate } from "./scheduleTopicsByDate";
import moment from "moment";
import { generateQuiz, generateQuizWithRetry } from "./quizGenerator.service";
import { getQuizQuestionCount } from "./generateQuizCount";
import { LogLevel, LogSource } from "../models/Log";
import { LoggingService } from "./logging.service";
import { extractTextFromFile } from "./llmTextExtractor.service";

// Repositories
const syllabusRepo = AppDataSource.getRepository(Syllabus);
const topicRepo = AppDataSource.getRepository(Topic);
const quizRepo = AppDataSource.getRepository(Quiz);
const questionRepo = AppDataSource.getRepository(QuizQuestion);

// Helper: sleep
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Add new interfaces
interface ProcessingResult {
  topicCount: number;
  quizCount: number;
}

interface QuizGenerationResult {
  quizzes: Quiz[];
  questions: QuizQuestion[];
}

interface QuizLevelStatus {
  level: QuizLevel;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

// Modify the Quiz entity to track level status
const processQuizzesForLevel = async (
  topics: Topic[],
  level: QuizLevel,
  syllabus: Syllabus
): Promise<QuizGenerationResult> => {
  const quizzes: Quiz[] = [];
  const questions: QuizQuestion[] = [];

  // Update syllabus status for this level
  await syllabusRepo.update(syllabus.id, {
    stage: level,
  });

  try {
    for (const topic of topics) {
      const quizData = await generateQuizWithRetry(
        topic.title,
        topic.summary,
        level,
        0,
        syllabus.preferredLanguage
      );

      const quiz = quizRepo.create({
        topic,
        level,
        totalQuestions: quizData.length,
      });

      quizzes.push(quiz);
      questions.push(
        ...quizData.map((q) => questionRepo.create({ ...q, quiz }))
      );
      await sleep(1500);
    }

    // Update syllabus status for this level
    await syllabusRepo.update(syllabus.id, {
      stage: level,
    });

    return { quizzes, questions };
  } catch (error) {
    await syllabusRepo.update(syllabus.id, {
      stage: level,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

const initializeSyllabus = async (syllabusId: number): Promise<Syllabus> => {
  await syllabusRepo.update(syllabusId, {
    status: SyllabusStatus.PROCESSING,
    processingStartedAt: new Date(),
  });

  const syllabus = await syllabusRepo.findOne({
    where: { id: syllabusId },
    select: [
      "id",
      "title",
      "preferredLanguage",
      "rawText",
      "status",
      "dailyStudyMinutes",
    ],
  });

  if (!syllabus) throw new Error("Syllabus not found");
  if (syllabus.status === SyllabusStatus.COMPLETED) {
    throw new Error("Syllabus already processed");
  }

  return syllabus;
};

const saveQuizData = async (quizzes: Quiz[], questions: QuizQuestion[]) => {
  console.log("Saving quiz data", { quizzes, questions });
  const savedQuizzes = await quizRepo.save(quizzes);

  const updatedQuestions = questions.map((q) => ({
    ...q,
    quiz: savedQuizzes.find((quiz) => quiz.topic.id === q.quiz.topic.id)!,
  }));

  await questionRepo.save(updatedQuestions);
};

const handleProcessingError = async (
  syllabusId: number,
  error: any,
  filePath: string
) => {
  await syllabusRepo.update(syllabusId, {
    status: SyllabusStatus.FAILED,
    errorMessage: error instanceof Error ? error.message : String(error),
    processingCompletedAt: new Date(),
  });

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// Modify the main processing function
export const processSyllabus = async (
  syllabusId: number,
  user: User,
  filePath: string
): Promise<ProcessingResult> => {
  try {
    console.log("Processing syllabus", { syllabusId, user, filePath });
    // Initialize
    const syllabus = await initializeSyllabus(syllabusId);
    const rawText =
      syllabus.rawText ||
      (await extractTextFromFile(filePath, syllabus.preferredLanguage));

    // Process topics
    const parsedTopics: any = await extractTopicsFromSyllabus(
      rawText,
      "",
      syllabus.preferredLanguage
    );

    await LoggingService.log(
      LogLevel.INFO,
      LogSource.SYLLABUS_PROCESSOR,
      `Scheduled topics`,
      { parsedTopics }
    );

    // Step 3: Schedule based on daily limit
    const scheduledTopics = scheduleTopicsByDate({
      topics: parsedTopics,
      startDate: new Date(),
      dailyLimit: syllabus.dailyStudyMinutes,
    });

    // Step 4: Assign dayIndex in order of assignedDate
    const sortedByDate = scheduledTopics.sort(
      (a, b) => a.assignedDate!.getTime() - b.assignedDate!.getTime()
    );

    const dateToIndexMap = new Map<string, number>();
    let index = 1;

    for (const topic of scheduledTopics) {
      const dateStr = moment(topic.assignedDate).format("YYYY-MM-DD");
      if (!dateToIndexMap.has(dateStr)) {
        dateToIndexMap.set(dateStr, index++);
      }
      topic.dayIndex = dateToIndexMap.get(dateStr)!;
    }

    const topics = await topicRepo.save(
      sortedByDate.map((t: any) =>
        topicRepo.create({
          syllabus,
          title: t.title,
          estimatedTimeMinutes: t.estimatedTimeMinutes || 5,
          summary: t.summary,
          keywords: t.keywords || [],
          assignedDate: t.assignedDate,
          dayIndex: t.dayIndex,
        })
      )
    );

    console.log("Topics=============>", topics);

    // Process Beginner quizzes first
    const beginnerResult = await processQuizzesForLevel(
      topics,
      QuizLevel.BEGINNER,
      syllabus
    );

    console.log("Beginner result=============>", beginnerResult);

    await saveQuizData(beginnerResult.quizzes, beginnerResult.questions);

    // Notify user that beginner quizzes are ready
    await sendLevelCompletionNotification(user, syllabusId, QuizLevel.BEGINNER);

    // Process Intermediate and Advanced in background
    processQuizzesForLevel(topics, QuizLevel.INTERMEDIATE, syllabus)
      .then(async (result) => {
        await saveQuizData(result.quizzes, result.questions);
        await sendLevelCompletionNotification(
          user,
          syllabusId,
          QuizLevel.INTERMEDIATE
        );
      })
      .catch(console.error);

    processQuizzesForLevel(topics, QuizLevel.ADVANCED, syllabus)
      .then(async (result) => {
        await saveQuizData(result.quizzes, result.questions);
        await sendLevelCompletionNotification(
          user,
          syllabusId,
          QuizLevel.ADVANCED
        );
      })
      .catch(console.error);

    // Finalize initial processing
    await syllabusRepo.update(syllabusId, {
      status: SyllabusStatus.COMPLETED,
      rawText,
      processingCompletedAt: new Date(),
    });

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return {
      topicCount: topics.length,
      quizCount: beginnerResult.quizzes.length,
    };
  } catch (error) {
    await handleProcessingError(syllabusId, error, filePath);
    throw error;
  }
};

// New notification function for level completion
const sendLevelCompletionNotification = async (
  user: User,
  syllabusId: number,
  level: QuizLevel
) => {
  try {
    await PushNotificationService.sendPushNotification(
      user.id,
      `Hi, ${level.toLowerCase()} Quizzes Ready! 🎉`,
      `Your ${level.toLowerCase()} level quizzes are now available!`,
      { syllabusId: syllabusId.toString(), level }
    );

    await EmailService.sendQuizReadyEmail(
      user.email,
      user.name,
      syllabusId.toString(),
      level
    );
  } catch (err) {
    console.error(`Notification error for ${level} level:`, err);
  }
};
