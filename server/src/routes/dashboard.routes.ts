import { Router } from "express";
import {
  getAttemptedQuizzes,
  getTodayDashboard,
} from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireEmailVerification } from "../middlewares/emailVerification.middleware";

const router = Router();

// Basic routes (no email verification required)
router.get("/today", requireAuth, requireEmailVerification, getTodayDashboard);

// Sensitive routes (require email verification)
router.get(
  "/attempted-quizzes",
  requireAuth,
  requireEmailVerification,
  getAttemptedQuizzes
);
// router.get("/stats", getDashboardStats);

export default router;
