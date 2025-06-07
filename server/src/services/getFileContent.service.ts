import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";

export const getFileContent = async (filePath: string): Promise<Buffer> => {
  try {
    const s3client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
    // Extract the key from the S3 URL
    const url = new URL(filePath);
    const key = url.pathname.substring(1); // Remove leading slash

    const command = new GetObjectCommand({
      Bucket: "syllabus-buddy",
      Key: key,
    });

    const response = await s3client.send(command);

    if (!response.Body) {
      throw new Error("S3 response Body is empty");
    }

    const stream = response.Body as Readable;

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error reading file from S3:", error);
    throw error;
  }
};
