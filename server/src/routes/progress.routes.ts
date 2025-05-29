import { Router } from "express";
import {
  getProgressStats,
  submitQuizAttempt,
} from "../controllers/progress.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/submit/:quizId", requireAuth, submitQuizAttempt);
router.get("/stats", requireAuth, getProgressStats);

export default router;
