import moment from "moment";
import { Between } from "typeorm";
import { Request, Response } from "express";
import { AppDataSource } from "../db/data-source";
import { Syllabus } from "../models/Syllabus";
import { Topic } from "../models/Topic";
import { Quiz } from "../models/Quiz";
import { UserProgress } from "../models/UserProgress";
import { User } from "../models/User";

const syllabusRepo = AppDataSource.getRepository(Syllabus);
const topicRepo = AppDataSource.getRepository(Topic);
const quizRepo = AppDataSource.getRepository(Quiz);
const progressRepo = AppDataSource.getRepository(UserProgress);
const userRepo = AppDataSource.getRepository(User);

//TODO:
//1. Add Start date and end date in request param

// export const getTodayDashboard = async (req: Request, res: Response) => {
//   const userId = (req as any).userId;

//   const user = await userRepo.findOneBy({ id: userId });

//   const syllabi = await syllabusRepo.find({
//     where: { user: { id: userId } },
//     order: { createdAt: "ASC" },
//   });

//   const dashboardPerSyllabus = [];

//   for (const syllabus of syllabi) {
//     const createdAt = moment(syllabus.createdAt);
//     const todayIndex = moment().diff(createdAt, "days") + 1;

//     const allTopics = await topicRepo.find({
//       where: { syllabus: { id: syllabus.id } },
//       order: { dayIndex: "ASC" },
//     });

//     const dueTopics = allTopics.filter((t) => t.dayIndex <= todayIndex);

//     const results = [];
//     for (const topic of dueTopics) {
//       const quiz = await quizRepo.findOne({
//         where: { topic: { id: topic.id } },
//       });
//       let progress = null;
//       if (quiz) {
//         progress = await progressRepo.findOne({
//           where: {
//             user: { id: userId },
//             topic: { id: topic.id },
//             quiz: { id: quiz.id },
//           },
//         });
//       }

//       results.push({
//         topicId: topic.id,
//         topicTitle: topic.title,
//         quizGenerated: !!quiz,
//         quizId: quiz?.id || null,
//         quizAttempted: !!progress,
//         score: progress?.score || null,
//         totalQuestions: progress?.totalQuestions || null,
//         completedOn: progress?.completedOn || null,
//       });
//     }

//     dashboardPerSyllabus.push({
//       syllabusId: syllabus.id,
//       syllabusTitle: syllabus.title,
//       todayIndex,
//       totalTopics: allTopics.length,
//       completedTopics: results.filter((t) => t.quizAttempted).length,
//       remainingTopics: results.filter((t) => !t.quizAttempted).length,
//       topics: results,
//     });
//   }

//   res.json({
//     currentStreak: user?.currentStreak || 0,
//     dashboards: dashboardPerSyllabus,
//   });

//   return;
// };
export const getTodayDashboard = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const user = await userRepo.findOneBy({ id: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const today = moment().startOf("day").toDate();
  const tomorrow = moment().add(1, "day").startOf("day").toDate();

  // Try to get today's topics
  let topics = await topicRepo.find({
    where: {
      assignedDate: today,
      syllabus: { user: { id: userId } },
    },
    relations: ["syllabus"],
    order: { id: "ASC" },
  });

  // If all topics for today are attempted, fall back to tomorrow
  let allCompleted = true;
  const results = [];

  for (const topic of topics) {
    const quiz = await quizRepo.findOne({ where: { topic: { id: topic.id } } });

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

    const quizAttempted = !!progress;
    if (!quizAttempted) allCompleted = false;

    results.push({
      topicId: topic.id,
      topicTitle: topic.title,
      quizGenerated: !!quiz,
      quizId: quiz?.id || null,
      quizAttempted,
      score: progress?.score || null,
      totalQuestions: progress?.totalQuestions || null,
      completedOn: progress?.completedOn || null,
      assignedDate: topic.assignedDate,
    });
  }

  // If today's topics exist but are all completed → show tomorrow
  if (results.length > 0 && allCompleted) {
    topics = await topicRepo.find({
      where: {
        assignedDate: tomorrow,
        syllabus: { user: { id: userId } },
      },
      relations: ["syllabus"],
      order: { id: "ASC" },
    });

    results.length = 0; // reset results

    for (const topic of topics) {
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
        assignedDate: topic.assignedDate,
      });
    }
  }

  return res.json({
    currentStreak: user.currentStreak || 0,
    topics: results,
  });
};
