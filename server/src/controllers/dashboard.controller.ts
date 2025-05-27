import moment from "moment";
import { Between } from "typeorm";
import { Request, Response } from "express";
import { AppDataSource } from "../db/data-source";
import { Syllabus } from "../models/Syllabus";
import { Topic } from "../models/Topic";
import { Quiz } from "../models/Quiz";
import { UserProgress } from "../models/UserProgress";

const syllabusRepo = AppDataSource.getRepository(Syllabus);
const topicRepo = AppDataSource.getRepository(Topic);
const quizRepo = AppDataSource.getRepository(Quiz);
const progressRepo = AppDataSource.getRepository(UserProgress);

//TODO:
//1. Add Start date and end date in request param

export const getTodayDashboard = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const syllabus = await syllabusRepo.findOne({
    where: { user: { id: userId } },
    relations: ["user"],
    order: { createdAt: "DESC" },
  });

  if (!syllabus) {
    res.status(404).json({ error: "No syllabus found" });
    return;
  }

  const today = moment();
  const createdAt = moment(syllabus.createdAt);
  const todayIndex = today.diff(createdAt, "days") + 1;

  // Fetch all topics due till today
  const allTopics = await topicRepo.find({
    where: {
      syllabus: { id: syllabus.id },
    },
    order: { dayIndex: "ASC" },
  });

  const dueTopics = allTopics.filter((t) => t.dayIndex <= todayIndex);

  const results = [];

  for (const topic of dueTopics) {
    const quiz = await quizRepo.findOne({
      where: { topic: { id: topic.id } },
    });

    let progress = null;
    if (quiz) {
      progress = await progressRepo.findOne({
        where: {
          user: { id: userId },
          topic: { id: topic.id },
          quiz: { id: quiz.id },
        },
      });
    }

    results.push({
      topicId: topic.id,
      topicTitle: topic.title,
      quizGenerated: !!quiz,
      quizId: quiz?.id || null,
      quizAttempted: !!progress,
      score: progress?.score || null,
      totalQuestions: progress?.totalQuestions || null,
      completedOn: progress?.completedOn || null,
    });
  }

  res.json({
    todayIndex,
    totalTopics: allTopics.length,
    completedTopics: results.filter((t) => t.quizAttempted).length,
    remainingTopics: results.filter((t) => !t.quizAttempted).length,
    topics: results,
  });

  return;
};
