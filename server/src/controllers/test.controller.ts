import { Request, Response } from "express";
import { EmailService } from "../services/email.service";
import { NotificationService } from "../services/notification.service";
import { PushNotificationService } from "../services/pushNotification.service";
import { AppDataSource } from "../db/data-source";
import { UserProgress } from "../models/UserProgress";
import { StreakService } from "../services/streak.service";
import * as llmService from "../services/llm.service";
import { extractTextFromFile } from "../services/llmTextExtractor.service";
import { getFileContent } from "../services/getFileContent.service";
import PdfParse from "pdf-parse";

export const testEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, message } = req.body;

    await EmailService.sendEmail(
      to || "test@example.com",
      subject || "Test Email",
      message ||
        "<h1>Test Email</h1><p>This is a test email from Syllabus Buddy!</p>"
    );

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error: any) {
    console.error("Test email failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const testWelcomeEmail = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId; // From auth middleware

    await NotificationService.sendWelcomeNotification(userId);

    res.json({ success: true, message: "Welcome email queued successfully" });
  } catch (error: any) {
    console.error("Test welcome email failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const testStreakAlert = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { streak } = req.body;

    await NotificationService.sendStreakAlert(userId, streak || 5);

    res.json({ success: true, message: "Streak alert queued successfully" });
  } catch (error: any) {
    console.error("Test streak alert failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const testPushNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, message, data } = req.body;

    await PushNotificationService.sendPushNotification(
      userId,
      title || "Test Push Notification",
      message || "This is a test push notification from Syllabus Buddy!",
      data || { test: true }
    );

    res.json({ success: true, message: "Push notification sent successfully" });
  } catch (error: any) {
    console.error("Test push notification failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const savePushToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: "Push token is required" });
      return;
    }

    await PushNotificationService.savePushToken(userId, token);

    res.json({ success: true, message: "Push token saved successfully" });
  } catch (error: any) {
    console.error("Save push token failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const testStreakCalculation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Use the new streak service
    const streakData = await StreakService.getUserStreakData(userId);

    // Get raw progress data for debugging
    const progressData = await AppDataSource.getRepository(UserProgress).find({
      where: { user: { id: userId } },
      order: { completedOn: "DESC" },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        userId,
        streakData,
        progressData: progressData.map((p) => ({
          id: p.id,
          completedOn: p.completedOn,
          score: p.score,
          totalQuestions: p.totalQuestions,
        })),
      },
    });
  } catch (error: any) {
    console.error("Test streak calculation failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTestProgress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { daysAgo, score = 8, totalQuestions = 10 } = req.body;

    const completedDate = new Date();
    completedDate.setDate(completedDate.getDate() - (daysAgo || 0));
    completedDate.setHours(14, 0, 0, 0); // Set to 2 PM

    const progressRepo = AppDataSource.getRepository(UserProgress);
    const progress = progressRepo.create({
      user: { id: userId },
      topic: { id: 1 }, // Dummy topic ID
      quiz: { id: 1 }, // Dummy quiz ID
      score,
      totalQuestions,
      completedOn: completedDate,
    });

    await progressRepo.save(progress);

    res.json({
      success: true,
      message: "Test progress created",
      data: {
        completedOn: completedDate,
        score,
        totalQuestions,
      },
    });
  } catch (error: any) {
    console.error("Create test progress failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clearTestProgress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    await AppDataSource.getRepository(UserProgress).delete({
      user: { id: userId },
    });

    res.json({
      success: true,
      message: "All progress cleared for user",
    });
  } catch (error: any) {
    console.error("Clear test progress failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const testGpt4Turbo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    let rawText = "";
    const file = (req as any).file;

    // First try direct parsing for PDF and text files
    if (file.mimetype === "application/pdf") {
      const fileBuffer = await getFileContent(file.location);
      const parsed = await PdfParse(fileBuffer);
      rawText = parsed.text.replace(/\x00/g, "").trim();
    } else if (file.mimetype === "text/plain") {
      rawText = file.buffer.toString("utf-8").replace(/\x00/g, "").trim();
    }

    // If direct parsing failed or for images, use LLM extraction
    if (!rawText || rawText.length < 50) {
      console.log("Using LLM for text extraction...");
      rawText = await extractTextFromFile(file.buffer, file.mimetype);
    }

    // Final validation of extracted text
    if (!rawText || rawText.length < 50) {
      res.status(400).json({
        success: false,
        message:
          "Could not extract meaningful text from the file. Please try a different file.",
      });
      return;
    }

    const result = await llmService.extractTopicsWithGpt4Turbo(rawText);

    res.status(200).json({ model: "gpt-4-turbo", result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const testGemini15Pro = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    let rawText = "";
    const file = (req as any).file;

    // First try direct parsing for PDF and text files
    if (file.mimetype === "application/pdf") {
      const fileBuffer = await getFileContent(file.location);
      const parsed = await PdfParse(fileBuffer);
      rawText = parsed.text.replace(/\x00/g, "").trim();
    } else if (file.mimetype === "text/plain") {
      rawText = file.buffer.toString("utf-8").replace(/\x00/g, "").trim();
    }

    // If direct parsing failed or for images, use LLM extraction
    if (!rawText || rawText.length < 50) {
      console.log("Using LLM for text extraction...");
      rawText = await extractTextFromFile(file.buffer, file.mimetype);
    }

    // Final validation of extracted text
    if (!rawText || rawText.length < 50) {
      res.status(400).json({
        success: false,
        message:
          "Could not extract meaningful text from the file. Please try a different file.",
      });
      return;
    }

    const result = await llmService.extractTopicsWithGemini15Pro(rawText);

    res.status(200).json({ model: "gemini-1.5-pro", result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const testGemini15Flash = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    let rawText = "";
    const file = (req as any).file;

    // First try direct parsing for PDF and text files
    if (file.mimetype === "application/pdf") {
      const fileBuffer = await getFileContent(file.location);
      const parsed = await PdfParse(fileBuffer);
      rawText = parsed.text.replace(/\x00/g, "").trim();
    } else if (file.mimetype === "text/plain") {
      rawText = file.buffer.toString("utf-8").replace(/\x00/g, "").trim();
    }

    // If direct parsing failed or for images, use LLM extraction
    if (!rawText || rawText.length < 50) {
      console.log("Using LLM for text extraction...");
      rawText = await extractTextFromFile(file.buffer, file.mimetype);
    }

    // Final validation of extracted text
    if (!rawText || rawText.length < 50) {
      res.status(400).json({
        success: false,
        message:
          "Could not extract meaningful text from the file. Please try a different file.",
      });
      return;
    }

    const result = await llmService.extractTopicsWithGemini15Flash(rawText);

    res.status(200).json({ model: "gemini-1.5-flash", result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const testGpt4oMini = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    let rawText = "";
    const file = (req as any).file;

    // First try direct parsing for PDF and text files
    if (file.mimetype === "application/pdf") {
      const fileBuffer = await getFileContent(file.location);
      const parsed = await PdfParse(fileBuffer);
      rawText = parsed.text.replace(/\x00/g, "").trim();
    } else if (file.mimetype === "text/plain") {
      rawText = file.buffer.toString("utf-8").replace(/\x00/g, "").trim();
    }

    // If direct parsing failed or for images, use LLM extraction
    if (!rawText || rawText.length < 50) {
      console.log("Using LLM for text extraction...");
      rawText = await extractTextFromFile(file.buffer, file.mimetype);
    }

    // Final validation of extracted text
    if (!rawText || rawText.length < 50) {
      res.status(400).json({
        success: false,
        message:
          "Could not extract meaningful text from the file. Please try a different file.",
      });
      return;
    }

    const result = await llmService.extractTopicsWithGpt4oMini(rawText);

    res.status(200).json({ model: "gpt-4o-mini", result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
