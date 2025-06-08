import AWS from "aws-sdk";
import { User } from "../models/User";
import { configureAWS } from "../config/aws.config";
import { LogLevel, LogSource } from "../models/Log";
import { LoggingService } from "./logging.service";

const { sqs } = configureAWS();

export interface SyllabusProcessingJob {
  syllabusId: number;
  user: User;
  filePath?: string;
}
{
  /*
  Todo:
  1. Create beginner quiz only
  2. then let customer know, that quiz is ready
  3. Create intermediate quiz only
  4. then let customer know, that quiz is ready
  5. Create advanced quiz only
  6. then let customer know, that quiz is ready
  */
}
export class SyllabusQueueService {
  private static readonly QUEUE_URL = process.env.SYLLABUS_QUEUE_URL || "";

  static async enqueueSyllabusProcessing(
    job: SyllabusProcessingJob
  ): Promise<void> {
    try {
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

      await LoggingService.log(
        LogLevel.INFO,
        LogSource.SYLLABUS_QUEUE,
        `Enqueueing syllabus job for syllabus ${job.syllabusId}`,
        { syllabusId: job.syllabusId, filePath: job.filePath }
      );

      const result = await sqs.sendMessage(params).promise();

      await LoggingService.log(
        LogLevel.INFO,
        LogSource.SYLLABUS_QUEUE,
        `Successfully enqueued syllabus job`,
        {
          syllabusId: job.syllabusId,
          messageId: result.MessageId,
        }
      );
    } catch (error) {
      await LoggingService.log(
        LogLevel.ERROR,
        LogSource.SYLLABUS_QUEUE,
        `Failed to enqueue syllabus job`,
        {
          syllabusId: job.syllabusId,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      throw error;
    }
  }

  static async receiveMessages(): Promise<AWS.SQS.Message[]> {
    try {
      const params = {
        QueueUrl: this.QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
        MessageAttributeNames: ["All"],
        VisibilityTimeout: 60,
      };

      console.log("Polling for syllabus jobs");
      const result = await sqs.receiveMessage(params).promise();
      return result.Messages || [];
    } catch (error) {
      console.error("Error receiving syllabus messages:", error);
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
      console.error("Error deleting syllabus message:", error);
      throw error;
    }
  }
}
