import AWS from "aws-sdk";

export const configureAWS = () => {
  const config = {
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  };

  AWS.config.update(config);

  // Validate credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("AWS credentials not found in environment variables");
    throw new Error("AWS credentials not configured");
  }

  return {
    sqs: new AWS.SQS(),
    config,
  };
};
