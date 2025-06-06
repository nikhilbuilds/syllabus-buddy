import { configureAWS } from "../config/aws.config";
import { QueueService, SyllabusProcessingJob } from "../services/queue.service";
import { processSyllabus } from "../services/syllabusWorker.service";
import { SyllabusQueueService } from "../services/syllabusQueue.service";

const { sqs } = configureAWS();

export class SyllabusWorker {
  private static isRunning = false;
  private static readonly QUEUE_URL = process.env.SQS_QUEUE_URL || "";

  static async start() {
    if (this.isRunning) {
      console.log("Syllabus worker is already running");
      return;
    }

    console.log("Starting syllabus worker with config:", {
      queueUrl: this.QUEUE_URL,
      isRunning: this.isRunning,
    });

    this.isRunning = true;

    while (this.isRunning) {
      try {
        console.log("Polling for messages...");
        await this.pollMessages();
        // Add small delay between polls
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Polling error:", error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  static stop() {
    console.log("Stopping syllabus worker...");
    this.isRunning = false;
  }

  private static async pollMessages() {
    try {
      const messages = await SyllabusQueueService.receiveMessages();
      for (const message of messages) {
        await this.syllabusProcessMessage(message);
      }
    } catch (error) {
      console.error("Error polling syllabus messages:", error);
    }
  }

  private static async syllabusProcessMessage(message: AWS.SQS.Message) {
    try {
      console.log(
        "SyllabusWorker - Message Attributes:",
        message.MessageAttributes
      );

      // Only process syllabus messages
      if (
        message.MessageAttributes?.jobType?.StringValue !==
        "syllabus-processing"
      ) {
        console.log("SyllabusWorker - Skipping non-syllabus message");
        return;
      }

      if (!message.Body) {
        console.error("Message has no body");
        return;
      }

      const job: SyllabusProcessingJob = JSON.parse(message.Body);
      console.log("Processing syllabus job:", job);

      // Process the syllabus
      await processSyllabus(job.syllabusId, job.user, job.filePath);

      // Delete the message from queue after successful processing
      if (message.ReceiptHandle) {
        await SyllabusQueueService.deleteMessage(message.ReceiptHandle);
        console.log("Successfully processed and deleted message");
      }
    } catch (error) {
      console.error("Error processing syllabus message:", error);

      // In a production environment, you might want to:
      // 1. Move the message to a dead letter queue
      // 2. Retry with exponential backoff
      // 3. Send alerts

      // For now, we'll just log the error and the message will become visible again
    }
  }
}
