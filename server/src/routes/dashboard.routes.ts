import { Router } from "express";
import {
  getAttemptedQuizzes,
  getTodayDashboard,
} from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/today", requireAuth, getTodayDashboard);
router.get("/attempted-quizzes", requireAuth, getAttemptedQuizzes);

export default router;
