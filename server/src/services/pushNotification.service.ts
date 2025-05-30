import { Expo } from "expo-server-sdk";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";

const expo = new Expo();

export class PushNotificationService {
  static async sendPushNotification(
    userId: number,
    title: string,
    message: string,
    data: any = {}
  ): Promise<void> {
    try {
      // Get user's push token from database
      const pushToken = await this.getUserPushToken(userId);

      if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
        console.log(`Invalid push token for user ${userId}: ${pushToken}`);
        return;
      }

      const messages = [
        {
          to: pushToken,
          sound: "default",
          title,
          body: message,
          data,
        },
      ];

      console.log("Sending push notification:", messages[0]);

      const chunks = expo.chunkPushNotifications(messages);

      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("Push notification tickets:", ticketChunk);
      }

      console.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      console.error("Error sending push notification:", error);
      throw error;
    }
  }

  private static async getUserPushToken(
    userId: number
  ): Promise<string | null> {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: userId },
    });
    return user?.pushToken || null;
  }

  // Method to save push token
  static async savePushToken(userId: number, token: string): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    await userRepo.update(userId, { pushToken: token });
    console.log(`Push token saved for user ${userId}`);
  }
}
