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
import { startResetStreakJob } from "./jobs/resetStreak.job";

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

createAppDataSource()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    startResetStreakJob(); // 👈 Starts the cron
  })
  .catch((err) => console.error("Error starting server:", err));
