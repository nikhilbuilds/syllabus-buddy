import { AppDataSource } from "../db/data-source";
import { UserProgress } from "../models/UserProgress";
import { User } from "../models/User";
import moment from "moment";
import { log } from "console";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date | null;
  hasActivityToday: boolean;
  streakDates: string[];
  cachedStreak: number;
  lastStreakUpdate: Date | null;
}

export class StreakService {
  /**
   * Quick streak update using User model (for real-time updates)
   */
  static async updateUserStreakFast(userId: number): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: userId });

    if (!user) return;

    user.updateStreakForToday();
    await userRepo.save(user);
  }

  /**
   * Comprehensive streak calculation (for detailed analysis)
   */
  static async getUserStreakData(userId: number): Promise<StreakData> {
    const progressData = await this.getUserProgressData(userId);
    const detailedStreak = this.calculateStreakData(progressData);

    // Get cached data from User model
    const user = await AppDataSource.getRepository(User).findOneBy({
      id: userId,
    });

    return {
      ...detailedStreak,
      cachedStreak: user?.currentStreak || 0,
      lastStreakUpdate: user?.lastStreakUpdate || null,
    };
  }

  /**
   * Sync User model streak with calculated streak (for accuracy)
   */
  static async syncUserStreak(userId: number): Promise<void> {
    const detailedData = await this.getUserStreakData(userId);
    const userRepo = AppDataSource.getRepository(User);

    await userRepo.update(userId, {
      currentStreak: detailedData.currentStreak,
      lastStreakUpdate: new Date(),
    });
  }

  /**
   * Check and break streaks for inactive users (cron job) - SQL Optimized
   */
  static async checkAndBreakInactiveStreaks(): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);

    // Calculate the cutoff date (before yesterday)
    const yesterdayStr = moment().subtract(1, "day").format("YYYY-MM-DD");
    const todayStr = moment().format("YYYY-MM-DD");

    // Use SQL to update all inactive users at once
    const result = await userRepo
      .createQueryBuilder()
      .update(User)
      .set({ currentStreak: 0 })
      .where("currentStreak > 0")
      .andWhere("lastStreakUpdate IS NOT NULL")
      .andWhere("DATE(lastStreakUpdate) < :yesterdayStr", { yesterdayStr })
      .andWhere("DATE(lastStreakUpdate) != :todayStr", { todayStr })
      .execute();

    console.log({ result });

    console.log(`Broke streaks for ${result.affected || 0} inactive users`);
  }

  /**
   * Ultra-optimized version using raw SQL
   */
  static async checkAndBreakInactiveStreaksUltraFast(): Promise<void> {
    const connection = AppDataSource;

    const yesterdayStr = moment().subtract(1, "day").format("YYYY-MM-DD");
    const todayStr = moment().format("YYYY-MM-DD");

    // Single SQL query to break all inactive streaks
    const result = await connection.query(
      `
      UPDATE user 
      SET currentStreak = 0 
      WHERE currentStreak > 0 
        AND lastStreakUpdate IS NOT NULL 
        AND DATE(lastStreakUpdate) < ? 
        AND DATE(lastStreakUpdate) != ?
    `,
      [yesterdayStr, todayStr]
    );

    console.log(
      `Broke streaks for ${
        result.affectedRows || 0
      } inactive users (ultra-fast)`
    );
  }

  /**
   * Get user's progress data optimized for streak calculation
   */
  private static async getUserProgressData(
    userId: number
  ): Promise<UserProgress[]> {
    return await AppDataSource.getRepository(UserProgress)
      .createQueryBuilder("progress")
      .where("progress.user_id = :userId", { userId })
      .orderBy("progress.completedOn", "DESC")
      .getMany();
  }

  /**
   * Calculate all streak-related data from progress data
   */
  static calculateStreakData(
    progressData: UserProgress[]
  ): Omit<StreakData, "cachedStreak" | "lastStreakUpdate"> {
    if (!progressData || progressData.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: null,
        hasActivityToday: false,
        streakDates: [],
      };
    }

    // Group progress by date
    const dailyProgress = this.groupProgressByDate(progressData);
    const uniqueDates = this.getSortedUniqueDates(dailyProgress);

    // Calculate current streak
    const currentStreakData = this.calculateCurrentStreak(uniqueDates);

    // Calculate longest streak
    const longestStreak = this.calculateLongestStreak(uniqueDates);

    // Get last activity
    const lastActivity = progressData[0]?.completedOn || null;

    // Check if has activity today
    const today = new Date().toDateString();
    const hasActivityToday = dailyProgress.has(today);

    console.log({ currentStreakData });

    return {
      currentStreak: currentStreakData.streak,
      longestStreak,
      lastActivity,
      hasActivityToday,
      streakDates: currentStreakData.dates,
    };
  }

  /**
   * Group progress entries by date
   */
  private static groupProgressByDate(
    progressData: UserProgress[]
  ): Map<string, UserProgress[]> {
    const dailyProgress = new Map<string, UserProgress[]>();

    for (const progress of progressData) {
      const dateKey = new Date(progress.completedOn).toDateString();
      if (!dailyProgress.has(dateKey)) {
        dailyProgress.set(dateKey, []);
      }
      dailyProgress.get(dateKey)!.push(progress);
    }

    return dailyProgress;
  }

  /**
   * Get sorted unique dates from daily progress
   */
  private static getSortedUniqueDates(
    dailyProgress: Map<string, UserProgress[]>
  ): Date[] {
    return Array.from(dailyProgress.keys())
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime());
  }

  /**
   * Calculate current streak starting from today or yesterday
   */
  private static calculateCurrentStreak(uniqueDates: Date[]): {
    streak: number;
    dates: string[];
  } {
    if (uniqueDates.length === 0) return { streak: 0, dates: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    const streakDates: string[] = [];
    let checkDate = new Date(today);

    // If no activity today, start checking from yesterday
    const todayStr = today.toDateString();
    const hasActivityToday = uniqueDates.some(
      (date) => date.toDateString() === todayStr
    );

    if (!hasActivityToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Count consecutive days
    for (const progressDate of uniqueDates) {
      const progressDateStr = progressDate.toDateString();
      const checkDateStr = checkDate.toDateString();

      if (progressDateStr === checkDateStr) {
        streak++;
        streakDates.push(progressDateStr);
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (progressDate < checkDate) {
        // Gap found, break the streak
        break;
      }
    }

    return { streak, dates: streakDates };
  }

  /**
   * Calculate the longest streak in the user's history
   */
  private static calculateLongestStreak(uniqueDates: Date[]): number {
    if (uniqueDates.length === 0) return 0;

    let longestStreak = 0;
    let currentStreak = 1;

    // Sort dates in ascending order for this calculation
    const sortedDates = [...uniqueDates].sort(
      (a, b) => a.getTime() - b.getTime()
    );

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currentDate = sortedDates[i];

      // Check if dates are consecutive
      const dayDiff = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }

    return Math.max(longestStreak, currentStreak);
  }

  /**
   * Check if user needs streak alert
   */
  static async shouldSendStreakAlert(userId: number): Promise<boolean> {
    const streakData = await this.getUserStreakData(userId);
    return streakData.currentStreak > 0 && !streakData.hasActivityToday;
  }
}
