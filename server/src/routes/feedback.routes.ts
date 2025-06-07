import { Router } from "express";
import {
  getUserFeedbacks,
  submitFeedback,
} from "../controllers/feedback.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticateToken, submitFeedback);
router.get("/", authenticateToken, getUserFeedbacks);

export default router;
