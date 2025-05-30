import { QueueService } from "../services/queue.service";
import { NotificationService } from "../services/notification.service";

export class NotificationWorker {
  private isRunning = false;

  async start(): Promise<void> {
    this.isRunning = true;
    console.log("Notification worker started");

    while (this.isRunning) {
      try {
        const messages = await QueueService.receiveMessages();

        for (const message of messages) {
          try {
            const data = JSON.parse(message.Body || "{}");
            await NotificationService.processNotification(data.notificationId);

            // Delete message from queue after successful processing
            if (message.ReceiptHandle) {
              await QueueService.deleteMessage(message.ReceiptHandle);
            }
          } catch (error) {
            console.error("Error processing notification:", error);
            // Message will remain in queue for retry
          }
        }
      } catch (error) {
        console.error("Error in notification worker:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    console.log("Notification worker stopped");
  }
}
