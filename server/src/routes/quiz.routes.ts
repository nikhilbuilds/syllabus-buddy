import { Router } from "express";
import { generateQuiz, getQuizByTopic } from "../controllers/quiz.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/generate/:topicId", requireAuth, generateQuiz);
router.get("/:topicId", requireAuth, getQuizByTopic);

export default router;
