import AWS from "aws-sdk";
import { User } from "../models/User";
import { configureAWS } from "../config/aws.config";

const { sqs } = configureAWS();

export interface QueueMessage {
  notificationId: number;
  userId: number;
  type: string;
  channel: string;
  data: any;
}

export interface SyllabusProcessingJob {
  syllabusId: number;
  user: User;
  filePath: string;
  preferredLanguage: string;
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

  static async enqueueSyllabusProcessing(
    job: SyllabusProcessingJob
  ): Promise<void> {
    const params = {
      QueueUrl: this.QUEUE_URL,
      MessageBody: JSON.stringify(job),
      MessageAttributes: {
        jobType: {
          DataType: "String",
          StringValue: "syllabus-processing",
        },
      },
    };

    console.log("Attempting to send message to SQS:", {
      queueUrl: this.QUEUE_URL,
      syllabusId: job.syllabusId,
      messageBody: JSON.stringify(job).substring(0, 100) + "...", // Log first 100 chars
    });

    try {
      const result = await sqs.sendMessage(params).promise();
      console.log("Successfully sent to SQS:", {
        MessageId: result.MessageId,
        syllabusId: job.syllabusId,
        queueUrl: this.QUEUE_URL,
      });
    } catch (error) {
      console.error("SQS Send Error:", {
        error,
        queueUrl: this.QUEUE_URL,
        syllabusId: job.syllabusId,
      });
      throw error;
    }
  }
}
