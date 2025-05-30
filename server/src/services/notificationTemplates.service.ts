import { NotificationType } from "../models/Notification";

interface NotificationTemplate {
  title: string;
  message: string;
  emailSubject?: string;
  emailHtml?: string;
}

export class NotificationTemplateService {
  static getTemplate(
    type: NotificationType,
    data: any = {}
  ): NotificationTemplate {
    switch (type) {
      case NotificationType.STREAK_ALERT:
        return {
          title: "Don't lose your streak! 🔥",
          message: `You haven't studied today! Your ${data.currentStreak}-day streak is at risk. Complete a quiz to keep it going!`,
          emailSubject: "Your study streak is at risk!",
          emailHtml: `
            <h2>Don't lose your streak! 🔥</h2>
            <p>Hi ${data.userName},</p>
            <p>You haven't studied today! Your <strong>${data.currentStreak}-day streak</strong> is at risk.</p>
            <p>Complete a quiz to keep your momentum going!</p>
            <a href="${data.appUrl}" style="background-color: #ffd33d; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Open Syllabus Buddy</a>
          `,
        };

      case NotificationType.WELCOME:
        return {
          title: "Welcome to Syllabus Buddy! 🎉",
          message:
            "Start your learning journey by uploading your first syllabus!",
          emailSubject: "Welcome to Syllabus Buddy!",
          emailHtml: `
            <h2>Welcome to Syllabus Buddy! 🎉</h2>
            <p>Hi ${data.userName},</p>
            <p>We're excited to help you ace your studies with AI-powered learning!</p>
            <p>Get started by uploading your syllabus and let our AI create personalized quizzes for you.</p>
            <a href="${data.appUrl}" style="background-color: #ffd33d; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Get Started</a>
          `,
        };

      case NotificationType.NEW_FEATURE:
        return {
          title: `New Feature: ${data.featureName}! ✨`,
          message: data.featureDescription,
          emailSubject: `New Feature Available: ${data.featureName}`,
          emailHtml: `
            <h2>New Feature: ${data.featureName}! ✨</h2>
            <p>Hi ${data.userName},</p>
            <p>${data.featureDescription}</p>
            <a href="${data.appUrl}" style="background-color: #ffd33d; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Try It Now</a>
          `,
        };

      default:
        return {
          title: "Notification",
          message: "You have a new notification",
        };
    }
  }
}
