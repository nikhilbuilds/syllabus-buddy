import { Router } from "express";
import {
  generateQuiz,
  getQuizById,
  getQuizByTopic,
} from "../controllers/quiz.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/generate/:topicId", requireAuth, generateQuiz);
router.get("/:topicId/:level", requireAuth, getQuizByTopic);
router.get("/:quizId", requireAuth, getQuizById);

export default router;
