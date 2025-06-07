import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createAppDataSource } from "./db/data-source";
import userRoutes from "./routes/user.routes";
import syllabusRoutes from "./routes/syllabus.routes";
import quizRoutes from "./routes/quiz.routes";
import progressRoutes from "./routes/progress.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import testRoutes from "./routes/test.routes";
import onboardingRoutes from "./routes/onboarding.routes";
import { NotificationWorker } from "./workers/notificationWorker";
import { StreakMonitorService } from "./services/streakMonitor.service";
import cron from "node-cron";
import { SyllabusWorker } from "./workers/syllabusWorker";
import feedbackRoutes from "./routes/feedback.routes";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/syllabus", syllabusRoutes);
app.use("/api/v1/quiz", quizRoutes);
app.use("/api/v1/progress", progressRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/test", testRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);
app.use("/api/v1/feedback", feedbackRoutes);

createAppDataSource()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    if (process.env.RUN_WORKERS === "true") {
      console.log("Starting workers with config:", {
        queueUrl: process.env.SQS_QUEUE_URL,
        runWorkers: process.env.RUN_WORKERS,
      });

      // Start both workers
      Promise.all([NotificationWorker.start(), SyllabusWorker.start()]).catch(
        (error) => {
          console.error("Error starting workers:", error);
        }
      );
    }

    //    cron.schedule("*/2 * * * * *", async () => {
    //      console.log("Running streak monitoring every 2 seconds...");
    //      await StreakMonitorService.checkStreaksAndNotify();
    //    });

    // Cron job that runs every 6 hours (at 00:00, 06:00, 12:00, 18:00)
    cron.schedule("0 */6 * * *", async () => {
      console.log("Running streak monitoring every 6 hours...");
      await StreakMonitorService.checkStreaksAndNotify();
    });
  })
  .catch((err) => console.error("Error starting server:", err));
