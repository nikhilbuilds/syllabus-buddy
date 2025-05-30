import { Router } from "express";
import {
  initiateRegistration,
  verifyEmail,
  completeOnboarding,
  getOnboardingStatus,
} from "../controllers/onboarding.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Add a simple test endpoint
router.get("/test", (req, res) => {
  console.log("Test endpoint hit!");
  res.json({ message: "Onboarding routes working!" });
});

// Public routes
router.post("/register", initiateRegistration);
router.post("/verify-email", verifyEmail);

// Protected routes
router.post("/complete", requireAuth, completeOnboarding);
router.get("/status", requireAuth, getOnboardingStatus);

export default router;
