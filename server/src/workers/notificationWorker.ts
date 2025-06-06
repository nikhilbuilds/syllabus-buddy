import { configureAWS } from "../config/aws.config";
import { NotificationQueueService } from "../services/notificationQueue.service";
import { NotificationService } from "../services/notification.service";

const { sqs } = configureAWS();

export class NotificationWorker {
  private static isRunning = false;

  static async start() {
    if (this.isRunning) {
      console.log("Notification worker already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting notification worker...");

    while (this.isRunning) {
      try {
        const messages = await NotificationQueueService.receiveMessages();
        console.log("notificationmessages", messages);
        for (const message of messages) {
          await this.processMessage(message);
          if (message.ReceiptHandle) {
            await NotificationQueueService.deleteMessage(message.ReceiptHandle);
          }
        }
      } catch (error) {
        console.error("Error in notification worker:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  private static async processMessage(message: any) {
    try {
      console.log("Processing message in notification worker:", message);
      const data = JSON.parse(message.Body || "{}");
      await NotificationService.processNotification(data.notificationId);
    } catch (error) {
      console.error("Error processing notification:", error);
      // Message will remain in queue for retry
    }
  }

  static stop(): void {
    this.isRunning = false;
    console.log("Notification worker stopped");
  }
}
