import { Router } from "express";
import {
  getAllUsers,
  getUserDetails,
  getSystemStats,
  updateUserRole,
} from "../controllers/admin.controller";
import {
  uploadCurrentAffairsPDF,
  getAllCurrentAffairs,
  getCurrentAffairById,
  updateCurrentAffair,
  deleteCurrentAffair,
  createCurrentAffairsPDF,
} from "../controllers/currentAffairs.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import uploadMiddleware from "../middleware/upload.middleware";
import { validateFileType } from "../middleware/fileValidation.middleware";

const router = Router();

// All admin routes require authentication and admin privileges
router.use(requireAuth);
router.use(requireAdmin);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.patch("/users/:userId/role", updateUserRole);

// System statistics
router.get("/stats", getSystemStats);

// Current Affairs routes
router.post(
  "/current-affairs/upload",
  uploadMiddleware.single("file"),
  validateFileType,
  uploadCurrentAffairsPDF
);
router.post("/current-affairs/create", createCurrentAffairsPDF);
router.get("/current-affairs", getAllCurrentAffairs);
router.get("/current-affairs/:id", getCurrentAffairById);
router.patch("/current-affairs/:id", updateCurrentAffair);
router.delete("/current-affairs/:id", deleteCurrentAffair);

export default router;
