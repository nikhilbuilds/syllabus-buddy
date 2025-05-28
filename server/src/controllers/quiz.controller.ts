import { Request, Response } from "express";
import { AppDataSource } from "../db/data-source";
import { Topic } from "../models/Topic";
import { Quiz } from "../models/Quiz";
import { QuizQuestion } from "../models/QuizQuestion";
import { generateQuizForTopic } from "../services/quizGenerator.service";
import { Equal } from "typeorm";
import { UserProgress } from "../models/UserProgress";
import { QuizLevel } from "../constants/quiz";
import { getQuizQuestionCount } from "../services/generateQuizCount";

const topicRepo = AppDataSource.getRepository(Topic);
const quizRepo = AppDataSource.getRepository(Quiz);
const questionRepo = AppDataSource.getRepository(QuizQuestion);
const progressRepo = AppDataSource.getRepository(UserProgress);

//TODO: APIS Needed -
// 1. Generate new quiz - with premium model
// 2. Add reattempt logic for topics (after 3 days, for example)?

export const generateQuiz = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const level = req.body.level || QuizLevel.BEGINNER;

  const topic = await topicRepo.findOne({
    where: { id: topicId },
    relations: ["syllabus", "syllabus.user"],
  });

  if (!topic || topic.syllabus.user.id !== userId) {
    res.status(403).json({ error: "Not allowed" });
    return;
  }

  try {
    const existingQuiz = await quizRepo.findOne({
      where: { topic: { id: topicId }, level },
    });

    console.log({ existingQuiz });

    //do not generate quiz if it already exists
    //TODO: add reattempt logic - monetize it
    if (existingQuiz) {
      // const attempted = await progressRepo.findOne({
      //   where: {
      //     user: Equal(userId),
      //     topic: Equal(topic.id),
      //     quiz: Equal(existingQuiz.id),
      //   },
      // });

      // if (attempted?.id) {
      //   res.status(200).json({
      //     message: "Quiz already attempted",
      //     quizId: existingQuiz.id,
      //     topicTitle: topic.title,
      //     attempted: true,
      //   });
      // }

      const existingQuestions = await questionRepo.find({
        where: { quiz: { id: existingQuiz.id, level: level } },
      });

      res.json({
        quizId: existingQuiz.id,
        topicTitle: topic.title,
        attempted: false,
        level: existingQuiz.level,
        questions: existingQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
        })),
      });
      return;
    }

    const questionCount = getQuizQuestionCount(
      topic.estimatedTimeMinutes,
      level
    );

    const quizData = await generateQuizForTopic(
      topic.title,
      topic.syllabus.rawText,
      level,
      questionCount
    );

    const quiz = quizRepo.create({ topic, level });
    await quizRepo.save(quiz);

    const questions = quizData.map((q: any) =>
      questionRepo.create({
        quiz,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
      })
    );

    await questionRepo.save(questions);

    res
      .status(201)
      .json({ message: "Quiz generated", quizId: quiz.id, questions });
    return;
  } catch (err) {
    console.error("Quiz error:", err);
    res.status(500).json({ error: "Quiz generation failed" });
    return;
  }
};

export const getQuizByTopic = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const topicId = Number(req.params.topicId);
  const level = req.params.level.toUpperCase() || QuizLevel.BEGINNER;

  const topic = await topicRepo.findOne({
    where: { id: topicId },
    relations: ["syllabus", "syllabus.user"],
  });

  if (!topic || topic.syllabus.user.id !== userId) {
    res.status(403).json({ error: "Not allowed" });
    return;
  }

  const quiz = await quizRepo.findOne({
    where: { topic: { id: topicId }, level: level as QuizLevel },
  });

  if (!quiz) {
    res.status(404).json({ error: "Quiz not found for this topic" });
    return;
  }

  const questions = await questionRepo.find({
    where: { quiz: { id: quiz.id, level: level as QuizLevel } },
  });

  res.json({
    quizId: quiz.id,
    topicTitle: topic.title,
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
    })),
  });
  return;
};

export const getQuizById = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const quizId = Number(req.params.quizId);

  try {
    const quiz = await quizRepo.findOne({
      where: { id: quizId },
      relations: ["topic", "topic.syllabus", "topic.syllabus.user"],
    });

    if (!quiz || quiz.topic.syllabus.user.id !== userId) {
      res.status(403).json({ error: "Not allowed" });
      return;
    }

    // Check if quiz was already attempted
    const attempted = await progressRepo.findOne({
      where: {
        user: Equal(userId),
        topic: Equal(quiz.topic.id),
        quiz: Equal(quiz.id),
      },
    });

    if (attempted?.id) {
      res.status(200).json({
        message: "Quiz already attempted",
        attempted: true,
      });
      return;
    }

    const questions = await questionRepo.find({
      where: { quiz: { id: quiz.id } },
    });

    res.json({
      quizId: quiz.id,
      topicTitle: quiz.topic.title,
      attempted: false,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
      })),
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
};
