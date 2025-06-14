import { Request, Response } from "express";
import { AppDataSource } from "../db/data-source";
import { Syllabus } from "../models/Syllabus";
import { Topic } from "../models/Topic";
import { extractTopicsFromSyllabus } from "../services/topicParser.service";
import { scheduleTopicsByDate } from "../services/scheduleTopicsByDate";
import moment from "moment";
import { generateQuizWithRetry } from "src/services/quizGenerator.service";

const syllabusRepo = AppDataSource.getRepository(Syllabus);
const topicRepo = AppDataSource.getRepository(Topic);

//TODO: APIS Needed -
// 1. Add or delete topics
// 2. Refresh Content
// 3. Update Time for each topics
// 4. Update daily minutes for syllabus

export const parseTopics = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const syllabusId = Number(req.params.id);
  const dailyMinutes = Number(req.body.dailyMinutes);
  const preferences = req.body.preferences;

  const syllabus = await syllabusRepo.findOne({
    where: { id: syllabusId },
    relations: ["user"],
  });

  if (!syllabus || syllabus.user.id !== userId) {
    res.status(404).json({ error: "Syllabus not found or unauthorized" });
    return;
  }

  try {
    // Step 1: Extract topics from LLM
    const parsedTopics: any = await extractTopicsFromSyllabus(
      syllabus.rawText,
      preferences,
      syllabus.preferredLanguage
    );

    console.log({ parsedTopics });

    // Step 2: Create topic entities
    const initialTopics = parsedTopics.map((t: any) =>
      topicRepo.create({
        syllabus,
        title: t.title,
        estimatedTimeMinutes: t.estimatedTime || 5,
        summary: t.summary,
        keywords: t?.keywords || [],
      })
    );

    console.log("initialTopics", initialTopics);

    // Step 3: Schedule based on daily limit
    const scheduledTopics = await scheduleTopicsByDate({
      topics: initialTopics,
      startDate: new Date(),
      dailyLimit: dailyMinutes,
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

    // Step 5: Save to DB
    const saved = await topicRepo.save(sortedByDate);

    res.status(201).json({
      message: "Topics parsed and scheduled",
      count: saved.length,
      topics: saved,
    });
    return;
  } catch (err) {
    console.error("Parse error:", err);
    res.status(500).json({ error: "Failed to parse topics" });
    return;
  }
};

export const getTopicsForSyllabus = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const syllabusId = Number(req.params.id);
  console.log({ userId, syllabusId });
  const syllabus = await syllabusRepo.findOne({
    where: { id: syllabusId },
    relations: ["user"],
  });

  if (!syllabus || syllabus.user.id !== userId) {
    res.status(404).json({ error: "Syllabus not found or unauthorized" });
    return;
  }

  const topics = await topicRepo.find({
    where: { syllabus: { id: syllabusId } },
    relations: ["quizzes", "syllabus", "quizzes.userProgress"],
    select: {
      quizzes: {
        id: true,
        level: true,
        totalQuestions: true,
        version: true,
        userProgress: {
          id: true,
          score: true,
          completedOn: true,
        },
      },
      id: true,
      title: true,
      estimatedTimeMinutes: true,
      dayIndex: true,
      assignedDate: true,
      syllabus: {
        id: true,
        title: true,
      },
    },
    order: { dayIndex: "ASC" },
  });

  res.json({ topics });
  return;
};
