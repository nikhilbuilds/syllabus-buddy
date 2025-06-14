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
import adminRoutes from "./routes/admin.routes";
import currentAffairsRoutes from "./routes/currentAffairs.routes";
import { logInfo, logError } from "./utils/logger";
dotenv.config();

const app = express();
const corsOptions = {
  origin: (origin, callback) => {
    // In development, allow all origins for easier testing.
    // For production, you should have a strict whitelist.
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }
    // Whitelist for production
    const whitelist = [
      "https://www.syllabusbuddy.com",
      "http://localhost:3000",
      "https://api.syllabusbuddy.com",
    ];
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  logInfo("Health check endpoint called");
  res.status(200).send("OK");
});

app.get("/health-check", (req, res) => {
  res.status(200).send("OK");
});

app.get("/health-test", (req, res) => {
  res.status(200).send("OK");
});

app.get("/test-error", (req, res) => {
  try {
    throw new Error("Simulated failure");
  } catch (err) {
    logError("Test error route failed", err);
    res.status(500).send("Something broke");
  }
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/syllabus", syllabusRoutes);
app.use("/api/v1/quiz", quizRoutes);
app.use("/api/v1/progress", progressRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/test", testRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/current-affairs", currentAffairsRoutes);

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
