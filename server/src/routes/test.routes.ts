import { Router } from "express";
import {
  testEmail,
  testWelcomeEmail,
  testStreakAlert,
  testPushNotification,
  savePushToken,
} from "../controllers/test.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Test basic email
router.post("/email", testEmail);

// Test notification emails (requires auth)
router.post("/welcome-email", requireAuth, testWelcomeEmail);
router.post("/streak-alert", requireAuth, testStreakAlert);

// Add these routes
router.post("/push-notification", requireAuth, testPushNotification);
router.post("/save-push-token", requireAuth, savePushToken);

export default router;
