import { AppDataSource } from "../db/data-source";
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
} from "../models/Notification";
import { User } from "../models/User";
import { NotificationTemplateService } from "./notificationTemplates.service";
import { QueueService } from "./queue.service";
import { EmailService } from "./email.service";
import { PushNotificationService } from "./pushNotification.service";

const notificationRepo = AppDataSource.getRepository(Notification);

export class NotificationService {
  static async createNotification(
    userId: number,
    type: NotificationType,
    channel: NotificationChannel,
    data: any = {},
    scheduledAt?: Date
  ): Promise<Notification> {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: userId },
    });
    if (!user) throw new Error("User not found");

    const template = NotificationTemplateService.getTemplate(type, {
      ...data,
      userName: user.name,
    });

    const notification = notificationRepo.create({
      user,
      type,
      channel,
      title: template.title,
      message: template.message,
      metadata: { ...data, template },
      scheduledAt,
    });

    await notificationRepo.save(notification);

    // Send to queue for processing
    await QueueService.sendMessage({
      notificationId: notification.id,
      userId,
      type,
      channel,
      data: { ...data, template },
    });

    return notification;
  }

  static async processNotification(notificationId: number): Promise<void> {
    const notification = await notificationRepo.findOne({
      where: { id: notificationId },
      relations: ["user"],
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    try {
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          await EmailService.sendEmail(
            notification.user.email,
            notification.metadata.template.emailSubject || notification.title,
            notification.metadata.template.emailHtml || notification.message
          );
          break;

        case NotificationChannel.PUSH:
          await PushNotificationService.sendPushNotification(
            notification.user.id,
            notification.title,
            notification.message,
            notification.metadata
          );
          break;

        default:
          throw new Error(
            `Unsupported notification channel: ${notification.channel}`
          );
      }

      // Update notification status
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await notificationRepo.save(notification);
    } catch (error: any) {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = error.message;
      await notificationRepo.save(notification);
      throw error;
    }
  }

  static async sendStreakAlert(
    userId: number,
    currentStreak: number
  ): Promise<void> {
    const data = {
      currentStreak,
      appUrl: process.env.APP_URL || "https://your-app.com",
    };

    // Send both push and email notifications
    await Promise.all([
      this.createNotification(
        userId,
        NotificationType.STREAK_ALERT,
        NotificationChannel.PUSH,
        data
      ),
      this.createNotification(
        userId,
        NotificationType.STREAK_ALERT,
        NotificationChannel.EMAIL,
        data
      ),
    ]);
  }

  static async sendWelcomeNotification(userId: number): Promise<void> {
    const data = {
      appUrl: process.env.APP_URL || "https://your-app.com",
    };

    await this.createNotification(
      userId,
      NotificationType.WELCOME,
      NotificationChannel.EMAIL,
      data
    );
  }
}
