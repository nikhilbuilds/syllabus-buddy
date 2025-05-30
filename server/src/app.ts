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
import { NotificationWorker } from "./workers/notificationWorker";
import { StreakMonitorService } from "./services/streakMonitor.service";
import cron from "node-cron";
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

createAppDataSource()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    const worker = new NotificationWorker();
    worker.start();

    // Cron job that runs every 6 hours (at 00:00, 06:00, 12:00, 18:00)
    cron.schedule("0 */6 * * *", async () => {
      console.log("Running streak monitoring every 6 hours...");
      await StreakMonitorService.checkStreaksAndNotify();
    });
  })
  .catch((err) => console.error("Error starting server:", err));
