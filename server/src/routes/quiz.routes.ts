import { Router } from "express";
import {
  generateQuiz,
  getQuizById,
  getQuizByTopic,
  regenerateQuiz,
} from "../controllers/quiz.controller";
import { requireEmailVerification } from "../middlewares/emailVerification.middleware";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/generate/:topicId", authenticateToken, generateQuiz);
router.get("/:topicId/:level", authenticateToken, getQuizByTopic);
router.get("/:quizId", authenticateToken, getQuizById);
router.post("/:topicId/regenerate-quiz", authenticateToken, regenerateQuiz);

// Apply to quiz routes
router.use(requireEmailVerification);

export default router;
