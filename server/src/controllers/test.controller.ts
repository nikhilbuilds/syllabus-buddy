import { Request, Response } from "express";
import { EmailService } from "../services/email.service";
import { NotificationService } from "../services/notification.service";
import { NotificationType, NotificationChannel } from "../models/Notification";
import { PushNotificationService } from "../services/pushNotification.service";

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
