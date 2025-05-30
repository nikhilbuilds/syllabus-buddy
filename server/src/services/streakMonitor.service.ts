import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import { UserProgress } from "../models/UserProgress";
import { NotificationService } from "./notification.service";

export class StreakMonitorService {
  static async checkStreaksAndNotify(): Promise<void> {
    const users = await AppDataSource.getRepository(User).find();

    for (const user of users) {
      try {
        const streak = await this.getCurrentStreak(user.id);
        const lastActivity = await this.getLastActivity(user.id);

        // Check if user hasn't been active today and has a streak to lose
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (streak > 0 && (!lastActivity || lastActivity < today)) {
          // Send streak alert
          await NotificationService.sendStreakAlert(user.id, streak);
        }
      } catch (error) {
        console.error(`Error checking streak for user ${user.id}:`, error);
      }
    }
  }

  private static async getCurrentStreak(userId: number): Promise<number> {
    // Implement your streak calculation logic
    // This is a placeholder - adapt to your existing streak logic
    return 0;
  }

  private static async getLastActivity(userId: number): Promise<Date | null> {
    const lastProgress = await AppDataSource.getRepository(
      UserProgress
    ).findOne({
      where: { user: { id: userId } },
      order: { completedOn: "DESC" },
    });

    return lastProgress?.completedOn || null;
  }
}
