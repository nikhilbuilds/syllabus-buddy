import { Request, Response } from "express";
import { AppDataSource } from "../db/data-source";
import { Syllabus } from "../models/Syllabus";
import { Topic } from "../models/Topic";
import { extractTopicsFromSyllabus } from "../services/topicParser.service";

const syllabusRepo = AppDataSource.getRepository(Syllabus);
const topicRepo = AppDataSource.getRepository(Topic);

//TODO: APIS Needed -
// 1. Add or delete topics
// 2. Refresh Content
// 3. Time for each topics

export const parseTopics = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const syllabusId = Number(req.params.id);

  const syllabus = await syllabusRepo.findOne({
    where: { id: syllabusId },
    relations: ["user"],
  });

  if (!syllabus || syllabus.user.id !== userId) {
    res.status(404).json({ error: "Syllabus not found or unauthorized" });
    return;
  }

  try {
    const existingTopics = await topicRepo.find({
      where: { syllabus: { id: syllabusId } },
      order: { dayIndex: "ASC" },
    });

    if (existingTopics.length > 0) {
      res
        .status(200)
        .json({ count: existingTopics.length, topics: existingTopics });
      return;
    }

    const parsedTopics = await extractTopicsFromSyllabus(syllabus.rawText);

    let dayIndex = 1;
    const topics = parsedTopics.map((t: any) =>
      topicRepo.create({
        syllabus,
        title: t.title,
        dayIndex,
        estimatedTimeMinutes: syllabus.user.dailyMinutes,
      })
    );

    await topicRepo.save(topics);

    res
      .status(201)
      .json({ message: "Topics parsed", count: topics.length, topics });
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
    order: { dayIndex: "ASC" },
  });

  res.json({ topics });
  return;
};
