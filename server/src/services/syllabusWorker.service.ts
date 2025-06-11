import fs from "fs";
import pdfParse from "pdf-parse";
import { AppDataSource } from "../db/data-source";
import { Syllabus, SyllabusStatus, ProcessingStep } from "../models/Syllabus";
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
import { S3Service } from "./s3.service";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { URL } from "url";
import { Readable } from "stream";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

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
  syllabusId: number
): Promise<QuizGenerationResult> => {
  const quizzes: Quiz[] = [];
  const questions: QuizQuestion[] = [];

  const syllabus = await syllabusRepo
    .createQueryBuilder("syllabus")
    .select([
      "syllabus.id",
      "syllabus.status",
      "syllabus.processingState",
      "syllabus.lastCompletedStep",
    ])
    .where("syllabus.id = :syllabusId", { syllabusId })
    .getOne();

  if (!syllabus) {
    throw new Error("Syllabus not found");
  }

  console.log("Processing quizzes for level", { level, topics, syllabus });

  // Check if this level is already processed
  const processingState = syllabus.processingState || {
    topicsSaved: false,
    beginnerQuizSaved: false,
    intermediateQuizSaved: false,
    advancedQuizSaved: false,
  };

  const isLevelProcessed = {
    [QuizLevel.BEGINNER]: processingState.beginnerQuizSaved,
    [QuizLevel.INTERMEDIATE]: processingState.intermediateQuizSaved,
    [QuizLevel.ADVANCED]: processingState.advancedQuizSaved,
  }[level];

  if (isLevelProcessed) {
    console.log(`Skipping ${level} quiz generation as it's already processed`);
    return { quizzes: [], questions: [] };
  }

  try {
    // Update syllabus status for this level
    await syllabusRepo
      .createQueryBuilder()
      .update(Syllabus)
      .set({ stage: level })
      .where("id = :syllabusId", { syllabusId })
      .execute();

    for (const topic of topics) {
      const quizData = await generateQuizWithRetry(
        topic.title,
        topic.summary,
        level,
        15,
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

    // Update processing state after successful quiz generation
    const newProcessingState = { ...processingState };
    switch (level) {
      case QuizLevel.BEGINNER:
        newProcessingState.beginnerQuizSaved = true;
        break;
      case QuizLevel.INTERMEDIATE:
        newProcessingState.intermediateQuizSaved = true;
        break;
      case QuizLevel.ADVANCED:
        newProcessingState.advancedQuizSaved = true;
        break;
    }

    await syllabusRepo
      .createQueryBuilder()
      .update(Syllabus)
      .set({
        stage: level,
        processingState: newProcessingState,
        lastCompletedStep: {
          [QuizLevel.BEGINNER]: ProcessingStep.BEGINNER_QUIZ_SAVED,
          [QuizLevel.INTERMEDIATE]: ProcessingStep.INTERMEDIATE_QUIZ_SAVED,
          [QuizLevel.ADVANCED]: ProcessingStep.ADVANCED_QUIZ_SAVED,
        }[level],
      })
      .where("id = :syllabusId", { syllabusId })
      .execute();

    return { quizzes, questions };
  } catch (error) {
    await syllabusRepo
      .createQueryBuilder()
      .update(Syllabus)
      .set({
        stage: level,
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .where("id = :syllabusId", { syllabusId })
      .execute();
    throw error;
  }
};

const initializeSyllabus = async (syllabusId: number): Promise<Syllabus> => {
  // First get the current syllabus state

  const existingSyllabus = await syllabusRepo
    .createQueryBuilder("syllabus")
    .select([
      "syllabus.id",
      "syllabus.status",
      "syllabus.processingState",
      "syllabus.lastCompletedStep",
    ])
    .where("syllabus.id = :syllabusId", { syllabusId })
    .getOne();

  // Only initialize processing state if it doesn't exist
  const processingState = existingSyllabus?.processingState || {
    topicsSaved: false,
    beginnerQuizSaved: false,
    intermediateQuizSaved: false,
    advancedQuizSaved: false,
  };

  // Update only if not already processing
  if (existingSyllabus?.status !== SyllabusStatus.PROCESSING) {
    await syllabusRepo.update(syllabusId, {
      status: SyllabusStatus.PROCESSING,
      processingStartedAt: new Date(),
      processingState,
    });
  }

  const syllabus = await syllabusRepo
    .createQueryBuilder("syllabus")
    .select([
      "syllabus.id",
      "syllabus.title",
      "syllabus.preferredLanguage",
      "syllabus.rawText",
      "syllabus.status",
      "syllabus.dailyStudyMinutes",
      "syllabus.processingState",
      "syllabus.lastCompletedStep",
      "syllabus.filePath",
    ])
    .where("syllabus.id = :syllabusId", { syllabusId })
    .getOne();

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
  fileKey: string
) => {
  console.error("Error processing syllabus:", error);

  // Update syllabus status
  await syllabusRepo.update(syllabusId, {
    status: SyllabusStatus.ERROR,
    errorMessage: error.message || "Unknown error occurred",
  });

  // Log the error
  await LoggingService.log(
    LogLevel.ERROR,
    LogSource.SYLLABUS_PROCESSOR,
    "Error processing syllabus",
    { syllabusId, error: error.message }
  );

  // Delete the file from S3
  // try {
  //   await S3Service.deleteFile(fileKey);
  // } catch (deleteError) {
  //   console.error("Error deleting file from S3:", deleteError);
  // }
};

const getFileContent = async (filePath: string): Promise<Buffer> => {
  try {
    // Extract the key from the S3 URL
    const url = new URL(filePath);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new GetObjectCommand({
      Bucket: "syllabus-buddy",
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("S3 response Body is empty");
    }

    const stream = response.Body as Readable;

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error reading file from S3:", error);
    throw error;
  }
};

// Modify the main processing function
export const processSyllabus = async (
  syllabusId: number,
  user: User,
  fileKey?: string
): Promise<ProcessingResult> => {
  try {
    console.log("Processing syllabus", { syllabusId, user, fileKey });
    // Initialize
    const syllabus = await initializeSyllabus(syllabusId);

    let rawText = syllabus?.rawText || "";

    if (!rawText) {
      // Get file from S3
      const fileBuffer = await getFileContent(syllabus.filePath);

      // Determine file type from file path
      const fileExtension = syllabus.filePath.split(".").pop()?.toLowerCase();
      let fileType = "application/pdf"; // default to PDF

      if (fileExtension === "txt") {
        fileType = "text/plain";
      } else if (["jpg", "jpeg"].includes(fileExtension || "")) {
        fileType = "image/jpeg";
      } else if (fileExtension === "png") {
        fileType = "image/png";
      } else if (fileExtension === "gif") {
        fileType = "image/gif";
      }

      // Extract text from file
      rawText = await extractTextFromFile(fileBuffer, fileType);

      // Update syllabus with extracted text
      await syllabusRepo.update(syllabusId, {
        rawText,
        lastCompletedStep: ProcessingStep.TEXT_EXTRACTED,
      });

      await LoggingService.log(
        LogLevel.INFO,
        LogSource.SYLLABUS_PROCESSOR,
        "Text extracted from file",
        { syllabusId, textLength: rawText.length, fileType }
      );
    }

    let topics: Topic[] = [];
    let beginnerResult: QuizGenerationResult | undefined;

    // Check if topics are already saved
    if (!syllabus.processingState?.topicsSaved) {
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

      topics = await topicRepo.save(
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

      // Update processing state after topics are saved
      await syllabusRepo.update(syllabusId, {
        processingState: {
          ...syllabus.processingState,
          topicsSaved: true,
        },
        lastCompletedStep: ProcessingStep.TOPICS_SAVED,
      });

      console.log("Topics=============>", topics);
    } else {
      // Get existing topics
      topics = await topicRepo.find({
        where: { syllabus: { id: syllabusId } },
      });
    }

    // Process Beginner quizzes if not already processed
    if (!syllabus.processingState?.beginnerQuizSaved) {
      beginnerResult = await processQuizzesForLevel(
        topics,
        QuizLevel.BEGINNER,
        syllabusId
      );

      console.log("Beginner result=============>", beginnerResult);

      if (beginnerResult.quizzes.length > 0) {
        await saveQuizData(beginnerResult.quizzes, beginnerResult.questions);
        // Notify user that beginner quizzes are ready
        await sendLevelCompletionNotification(
          user,
          syllabusId,
          QuizLevel.BEGINNER
        );
      }
    }

    // Process Intermediate quizzes if not already processed
    if (!syllabus.processingState?.intermediateQuizSaved) {
      let intermediateResult: QuizGenerationResult | undefined;

      intermediateResult = await processQuizzesForLevel(
        topics,
        QuizLevel.INTERMEDIATE,
        syllabusId
      );

      if (intermediateResult.quizzes.length > 0) {
        await saveQuizData(
          intermediateResult.quizzes,
          intermediateResult.questions
        );
        await sendLevelCompletionNotification(
          user,
          syllabusId,
          QuizLevel.INTERMEDIATE
        );
      }
    }

    // Process Advanced quizzes if not already processed
    if (!syllabus.processingState?.advancedQuizSaved) {
      let advancedResult: QuizGenerationResult | undefined;

      advancedResult = await processQuizzesForLevel(
        topics,
        QuizLevel.ADVANCED,
        syllabusId
      );

      if (advancedResult.quizzes.length > 0) {
        await saveQuizData(advancedResult.quizzes, advancedResult.questions);
        await sendLevelCompletionNotification(
          user,
          syllabusId,
          QuizLevel.ADVANCED
        );
      }
    }

    // Finalize initial processing
    await syllabusRepo.update(syllabusId, {
      status: SyllabusStatus.COMPLETED,
      rawText,
      processingCompletedAt: new Date(),
    });

    // Delete the file from S3 after processing
    //await S3Service.deleteFile(fileKey);

    return {
      topicCount: topics.length,
      quizCount: syllabus.processingState?.beginnerQuizSaved
        ? 0
        : beginnerResult?.quizzes.length || 0,
    };
  } catch (error) {
    await handleProcessingError(syllabusId, error, fileKey);
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
      `Hi, ${level.toLowerCase()} quizzes are ready! 🏃‍♂️`,
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
