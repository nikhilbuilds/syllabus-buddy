//create a batch service to send notifications to users
import { CurrentAffair } from "../models/CurrentAffair";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import { PushNotificationService } from "./pushNotification.service";

const userRepo = AppDataSource.getRepository(User);

export class NotificationBatchService {
  static async pushNotifications(currentAffairs: CurrentAffair[]) {
    const users = await userRepo.find();

    const notificationMessage = `${currentAffairs
      .map((currentAffair) => currentAffair.headline)
      .join(", ")}`;

    users.forEach((user) => {
      PushNotificationService.sendPushNotification(
        user.id,
        "New Current Affairs",
        notificationMessage
      );
    });
  }
}
