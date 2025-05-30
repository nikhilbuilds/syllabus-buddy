import AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_REGION || "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const sqs = new AWS.SQS();

export interface QueueMessage {
  notificationId: number;
  userId: number;
  type: string;
  channel: string;
  data: any;
}

export class QueueService {
  private static readonly QUEUE_URL = process.env.SQS_QUEUE_URL || "";

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
      console.log("Message sent to SQS:", message);
    } catch (error) {
      console.error("Error sending message to SQS:", error);
      throw error;
    }
  }

  static async receiveMessages(): Promise<AWS.SQS.Message[]> {
    try {
      const params = {
        QueueUrl: this.QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      };

      console.log("Receiving messages from SQS:", params);

      const result = await sqs.receiveMessage(params).promise();
      return result.Messages || [];
    } catch (error) {
      console.error("Error receiving messages from SQS:", error);
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
      console.error("Error deleting message from SQS:", error);
      throw error;
    }
  }
}
