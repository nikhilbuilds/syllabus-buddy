import { Request, Response } from "express";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import { Topic } from "../models/Topic";
import { Quiz } from "../models/Quiz";
import { QuizQuestion } from "../models/QuizQuestion";
import { UserProgress } from "../models/UserProgress";
import { Equal, In } from "typeorm";

import moment from "moment";
import { Syllabus } from "../models/Syllabus";
import { StreakService } from "../services/streak.service";

const userRepo = AppDataSource.getRepository(User);
const topicRepo = AppDataSource.getRepository(Topic);
const quizRepo = AppDataSource.getRepository(Quiz);
const questionRepo = AppDataSource.getRepository(QuizQuestion);
const progressRepo = AppDataSource.getRepository(UserProgress);
const syllabusRepo = AppDataSource.getRepository(Syllabus);

//TODO:
// 1. Add reattempt logic for topics (after 3 days, for example)?

export const submitQuizAttempt = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const quizId = Number(req.params.quizId);
  const { answers } = req.body;

  try {
    const user = await userRepo.findOneByOrFail({ id: userId });

    const quiz = await quizRepo.findOne({
      where: { id: quizId },
      relations: ["topic", "topic.syllabus", "topic.syllabus.user"],
    });

    if (!quiz || quiz.topic.syllabus.user.id !== userId) {
      res.status(403).json({ error: "Not allowed" });
      return;
    }

    const questions = await questionRepo.find({
      where: { quiz: { id: quiz.id } },
    });

    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] && answers[q.id] === q.answer) {
        correct++;
      }
    }

    const score = correct;
    const totalQuestions = questions.length;

    const existing = await progressRepo.findOne({
      where: {
        user: Equal(user.id),
        topic: Equal(quiz.topic.id),
        quiz: Equal(quiz.id),
      },
    });

    if (existing) {
      res.status(200).json({
        message: "Quiz already attempted",
        score: existing.score,
        totalQuestions: existing.totalQuestions,
      });
      return;
    }

    const progress = progressRepo.create({
      user,
      topic: quiz.topic,
      quiz,
      score,
      totalQuestions,
      completedOn: new Date(),
    });

    await progressRepo.save(progress);

    // Fast streak update using User model
    await StreakService.updateUserStreakFast(userId);

    // Get user with updated streak for response
    const userWithUpdatedStreak = await userRepo.findOneBy({ id: userId });

    res.status(200).json({
      message: "Quiz Complete!",
      score,
      totalQuestions,
      currentStreak: userWithUpdatedStreak?.currentStreak || 0,
    });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const getProgressStats = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const syllabus = await syllabusRepo.findOne({
    where: { user: { id: userId } },
    order: { createdAt: "DESC" },
  });

  if (!syllabus) {
    res.status(200).json({ message: "No syllabus found", totalTopics: [] });
    return;
  }

  const allTopics = await topicRepo.find({
    where: { syllabus: { id: syllabus.id } },
  });
  const topicIds = allTopics.map((t) => t.id);

  const allProgress = await progressRepo.find({
    where: {
      user: { id: userId },
      topic: { id: In(topicIds) },
    },
    order: { completedOn: "DESC" },
  });

  // Total and completed
  const totalTopics = allTopics.length;
  const completedTopics = allProgress.length;
  const completionRate =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Calculate streak
  const uniqueDays = new Set<string>();
  allProgress.forEach((p) => {
    const dateStr = moment(p.completedOn).format("YYYY-MM-DD");
    uniqueDays.add(dateStr);
  });

  // Sort dates descending
  const sortedDays = Array.from(uniqueDays).sort().reverse();
  let streak = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDate = moment().subtract(i, "days").format("YYYY-MM-DD");
    if (sortedDays[i] === expectedDate) {
      streak++;
    } else {
      break;
    }
  }

  const user = await userRepo.findOneBy({ id: userId });

  res.json({
    totalTopics,
    completedTopics,
    completionRate,
    streak: streak, // calculated from past data
    currentStreak: user?.currentStreak || 0, // saved in DB
  });

  return;
};
