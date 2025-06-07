import { AppDataSource } from "../db/data-source";
import { Log, LogSource } from "../models/Log";

interface CreateLogParams {
  userId: number;
  source: LogSource;
  message: string;
  metadata?: Record<string, any>;
}

export const createLog = async (params: CreateLogParams) => {
  try {
    const logRepo = AppDataSource.getRepository(Log);
    const log = logRepo.create({
      ...params,
    });
    await logRepo.save(log);
  } catch (error) {
    console.error("Log creation error:", error);
    // Don't throw error as logging should not break the main flow
  }
};
