import AWS from "aws-sdk";
import { configureAWS } from "../config/aws.config";

const { sqs } = configureAWS();

export interface QueueMessage {
  notificationId: number;
  userId: number;
  type: string;
  channel: string;
  data: any;
}

export class NotificationQueueService {
  private static readonly QUEUE_URL = process.env.NOTIFICATION_QUEUE_URL || "";

  static async sendMessage(message: QueueMessage): Promise<void> {
    try {
      const params = {
        QueueUrl: this.QUEUE_URL,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          NotificationType: {
            DataType: "String",
            StringValue: message.type,
          },
          Channel: {
            DataType: "String",
            StringValue: message.channel,
          },
        },
      };

      await sqs.sendMessage(params).promise();
      console.log("Notification message sent to SQS:", message);
    } catch (error) {
      console.error("Error sending notification to SQS:", error);
      throw error;
    }
  }

  static async receiveMessages(): Promise<AWS.SQS.Message[]> {
    try {
      const params = {
        QueueUrl: this.QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        MessageAttributeNames: ["All"],
      };

      console.log("Receiving notification messages from SQS");
      const result = await sqs.receiveMessage(params).promise();
      return result.Messages || [];
    } catch (error) {
      console.error("Error receiving notification messages:", error);
      throw error;
    }
  }

  static async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const params = {
        QueueUrl: this.QUEUE_URL,
        ReceiptHandle: receiptHandle,
      };
      await sqs.deleteMessage(params).promise();
    } catch (error) {
      console.error("Error deleting notification message:", error);
      throw error;
    }
  }
}
