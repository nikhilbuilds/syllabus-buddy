import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import dotenv from "dotenv";

dotenv.config();

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const isProduction = process.env.NODE_ENV === "production";

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat
      ),
    }),
  ],
});

if (isProduction) {
  const cloudwatchConfig = {
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP_NAME,
    logStreamName: `${process.env.CLOUDWATCH_LOG_STREAM_NAME}-${new Date()
      .toISOString()
      .slice(0, 10)}`,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.AWS_REGION,
    messageFormatter: ({ level, message, ...meta }: any) =>
      `[${level}] : ${message} \nAdditional Info: ${JSON.stringify(meta)}`,
  };

  if (
    cloudwatchConfig.logGroupName &&
    cloudwatchConfig.logStreamName &&
    cloudwatchConfig.awsRegion
  ) {
    logger.add(new WinstonCloudWatch(cloudwatchConfig));
    logger.info("CloudWatch transport configured.");
  } else {
    logger.warn(
      "CloudWatch transport not configured due to missing environment variables."
    );
  }
}

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: any, meta?: any) => {
  if (error instanceof Error) {
    logger.error(message, { ...meta, stack: error.stack });
  } else {
    logger.error(message, { ...meta, error: error });
  }
};

export default logger;
