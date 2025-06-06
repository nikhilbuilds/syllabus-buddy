import { AppDataSource } from "../db/data-source";
import { Log, LogLevel, LogSource } from "../models/Log";
import { Syllabus } from "../models/Syllabus";

const logRepo = AppDataSource.getRepository(Log);

export class LoggingService {
  static async log(
    level: LogLevel,
    source: LogSource,
    message: string,
    metadata?: any,
    syllabus?: Syllabus
  ) {
    try {
      const log = logRepo.create({
        level,
        source,
        message,
        metadata,
        syllabus,
      });

      await logRepo.save(log);

      // Also log to console for development
      const consoleMessage = `[${source}] ${level.toUpperCase()}: ${message}`;
      switch (level) {
        case LogLevel.ERROR:
          console.error(consoleMessage, metadata);
          break;
        case LogLevel.WARNING:
          console.warn(consoleMessage, metadata);
          break;
        default:
          console.log(consoleMessage, metadata);
      }
    } catch (error) {
      console.error("Failed to save log:", error);
    }
  }

  static async getLogsForSyllabus(syllabusId: number): Promise<Log[]> {
    return logRepo.find({
      where: { syllabus: { id: syllabusId } },
      order: { createdAt: "DESC" },
    });
  }
}
