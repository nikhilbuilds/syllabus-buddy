import { Request, Response } from "express";
import { Feedback } from "../models/feedback";
import { AppDataSource } from "../db/data-source";

const feedbackRepo = AppDataSource.getRepository(Feedback);

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { category, content } = req.body;

    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!category || !content) {
      res.status(400).json({ message: "Category and content are required" });
      return;
    }

    const feedback = feedbackRepo.create({
      userId,
      category,
      content,
    });

    await feedbackRepo.save(feedback);

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });
    return;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ message: "Error submitting feedback" });
  }
};

export const getUserFeedbacks = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const feedbacks = await feedbackRepo.find({
    where: { userId },
    order: { createdAt: "DESC" },
  });

  res.status(200).json({
    message: "Feedbacks fetched successfully",
    feedbacks,
  });
};
