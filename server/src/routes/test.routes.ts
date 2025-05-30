import { Router } from "express";
import {
  testEmail,
  testWelcomeEmail,
  testStreakAlert,
  testPushNotification,
  savePushToken,
  testStreakCalculation,
  createTestProgress,
  clearTestProgress,
} from "../controllers/test.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { StreakService } from "../services/streak.service";
import { Request, Response } from "express";
import { StreakMonitorService } from "../services/streakMonitor.service";

const router = Router();

// Test basic email
router.post("/email", testEmail);

// Test notification emails (requires auth)
router.post("/welcome-email", requireAuth, testWelcomeEmail);
router.post("/streak-alert", requireAuth, testStreakAlert);

// Add these routes
router.post("/push-notification", requireAuth, testPushNotification);
router.post("/save-push-token", requireAuth, savePushToken);

// Add these new routes
router.get("/streak", requireAuth, testStreakCalculation);
router.post("/create-progress", requireAuth, createTestProgress);
router.delete("/clear-progress", requireAuth, clearTestProgress);

// Add a dedicated streak endpoint
router.get(
  "/streak-detailed",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const streakData = await StreakService.getUserStreakData(userId);

      res.json({
        success: true,
        data: streakData,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Add manual trigger for streak monitoring
router.post(
  "/trigger-streak-monitor",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      console.log("Manually triggering streak monitoring...");
      await StreakMonitorService.checkStreaksAndNotify();

      res.json({
        success: true,
        message: "Streak monitoring completed",
      });
    } catch (error: any) {
      console.error("Manual streak monitoring failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
