import { Router } from "express";

import {
  getAllCurrentAffairs,
  getCurrentAffairById,
} from "../controllers/currentAffairs.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);

// Current Affairs routes
router.get("/", getAllCurrentAffairs);
router.get("/:id", getCurrentAffairById);

export default router;
