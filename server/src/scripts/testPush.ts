import { PushNotificationService } from "../services/pushNotification.service";
import { AppDataSource } from "../db/data-source";
import dotenv from "dotenv";

dotenv.config();

async function testPush() {
  try {
    await AppDataSource.initialize();

    // Replace with actual user ID and push token
    const userId = 1;
    const testToken = "ExponentPushToken[YOUR_TEST_TOKEN]";

    // Save test token
    await PushNotificationService.savePushToken(userId, testToken);

    // Send test notification
    await PushNotificationService.sendPushNotification(
      userId,
      "🎉 Test Push Notification",
      "If you see this, push notifications are working!",
      { test: true, timestamp: new Date().toISOString() }
    );

    console.log("✅ Push notification sent successfully!");
  } catch (error) {
    console.error("❌ Push notification failed:", error);
  }
}

testPush();
