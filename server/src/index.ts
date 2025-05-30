import { NotificationWorker } from "./workers/notificationWorker";
import { StreakMonitorService } from "./services/streakMonitor.service";
import cron from "node-cron";

// Start notification worker
const worker = new NotificationWorker();
worker.start();

// Schedule streak monitoring (runs every day at 6 PM)
cron.schedule("0 18 * * *", async () => {
  console.log("Running streak monitoring...");
  await StreakMonitorService.checkStreaksAndNotify();
});
