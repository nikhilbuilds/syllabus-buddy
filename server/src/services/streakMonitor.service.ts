import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import { NotificationService } from "./notification.service";
import { StreakService } from "./streak.service";
import moment from "moment";

export class StreakMonitorService {
  static async checkStreaksAndNotify(): Promise<void> {
    // Break inactive streaks first (optimized batch operation)
    await StreakService.checkAndBreakInactiveStreaks();

    // Get users who need notifications (with conditions in SQL)
    const userRepo = AppDataSource.getRepository(User);
    const usersNeedingAlerts = await userRepo
      .createQueryBuilder("user")
      .where("user.currentStreak > 0")
      .andWhere("user.lastStreakUpdate IS NOT NULL")
      .andWhere("DATE(user.lastStreakUpdate) != :today", {
        today: moment().format("YYYY-MM-DD"),
      })
      .andWhere("DATE(user.lastStreakUpdate) = :yesterday", {
        yesterday: moment().subtract(1, "day").format("YYYY-MM-DD"),
      })
      .getMany();

    // Send notifications
    const notificationPromises = usersNeedingAlerts.map(async (user) => {
      try {
        console.log(
          `Sending streak alert to user ${user.id}, streak: ${user.currentStreak}`
        );
        await NotificationService.sendStreakAlert(user.id, user.currentStreak);
      } catch (error) {
        console.error(`Error sending notification to user ${user.id}:`, error);
      }
    });

    // Execute all notifications in parallel
    await Promise.allSettled(notificationPromises);

    console.log(`Sent streak alerts to ${usersNeedingAlerts.length} users`);
  }
}
