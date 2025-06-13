import { Request, Response } from "express";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import { Syllabus } from "../models/Syllabus";
import { Topic } from "../models/Topic";
import { Quiz } from "../models/Quiz";
import { UserProgress } from "../models/UserProgress";
import { Feedback } from "../models/feedback";

const userRepo = AppDataSource.getRepository(User);
const syllabusRepo = AppDataSource.getRepository(Syllabus);
const topicRepo = AppDataSource.getRepository(Topic);
const quizRepo = AppDataSource.getRepository(Quiz);
const progressRepo = AppDataSource.getRepository(UserProgress);
const feedbackRepo = AppDataSource.getRepository(Feedback);

export const getUser = async (req: Request, res: Response) => {
  const userId = parseInt(req.body.userId);
  if (!userId) {
    res.status(400).json({ error: "User not found" });
    return;
  }
  const user = await userRepo.findOne({
    where: { id: userId },
    select: [
      "id",
      "email",
      "name",
      "isEmailVerified",
      "isOnboardingComplete",
      "preferredLanguage",
      "isAdmin",
    ],
  });

  res.json({ user });
};

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userRepo.find({
      select: {
        id: true,
        email: true,
        name: true,
        isEmailVerified: true,
        isOnboardingComplete: true,
        createdAt: true,
        updatedAt: true,
        isAdmin: true,
      },
    });

    res.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get user details
export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ["syllabi", "progress"],
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
};

// Get system statistics
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await userRepo.count();
    const totalSyllabi = await syllabusRepo.count();
    const totalTopics = await topicRepo.count();
    const totalQuizzes = await quizRepo.count();
    const totalProgress = await progressRepo.count();
    const totalFeedbacks = await feedbackRepo.count();

    const verifiedUsers = await userRepo.count({
      where: { isEmailVerified: true },
    });

    const onboardingCompleted = await userRepo.count({
      where: { isOnboardingComplete: true },
    });

    res.json({
      stats: {
        totalUsers,
        verifiedUsers,
        onboardingCompleted,
        totalSyllabi,
        totalTopics,
        totalQuizzes,
        totalProgress,
        totalFeedbacks,
      },
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({ error: "Failed to fetch system statistics" });
  }
};

// Update user role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { isAdmin } = req.body;

    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.isAdmin = isAdmin;
    await userRepo.save(user);

    res.json({ message: "User role updated successfully", user });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};
