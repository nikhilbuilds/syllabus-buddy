import { Router } from "express";
import {
  generateQuiz,
  getQuizById,
  getQuizByTopic,
} from "../controllers/quiz.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireEmailVerification } from "../middlewares/emailVerification.middleware";

const router = Router();

router.post("/generate/:topicId", requireAuth, generateQuiz);
router.get("/:topicId/:level", requireAuth, getQuizByTopic);
router.get("/:quizId", requireAuth, getQuizById);

// Apply to quiz routes
router.use(requireEmailVerification);

export default router;
