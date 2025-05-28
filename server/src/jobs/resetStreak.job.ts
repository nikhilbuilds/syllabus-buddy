import cron from "node-cron";
import moment from "moment";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";

export const startResetStreakJob = () => {
  console.log("Starting streak reset job");
  cron.schedule("30 0 * * *", async () => {
    console.log(`[Streak Reset Job] Running at ${new Date().toISOString()}`);

    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find();

    const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

    for (const user of users) {
      const lastUpdate = user.lastStreakUpdate
        ? moment(user.lastStreakUpdate).format("YYYY-MM-DD")
        : null;

      if (!lastUpdate || lastUpdate < yesterday) {
        user.currentStreak = 0;
        await userRepo.save(user);
        console.log(`Reset streak for user ${user.email}`);
      }
    }

    console.log(`[Streak Reset Job] Completed.`);
  });
};
