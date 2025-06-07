import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = "syllabus-buddy";

export class S3Service {
  private static readonly UPLOAD_PREFIX = "syllabus/uploads";
  private static readonly EXPIRY_TIME = 3600; // 1 hour

  /**
   * Generate a presigned URL for file upload
   */
  static async getPresignedUploadUrl(
    fileName: string,
    fileType: string
  ): Promise<{ uploadUrl: string; fileKey: string }> {
    const fileExtension = path.extname(fileName);
    const fileKey = `${this.UPLOAD_PREFIX}/${uuidv4()}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: this.EXPIRY_TIME,
    });

    return { uploadUrl, fileKey };
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
  }

  /**
   * Get the S3 URL for a file
   */
  static getFileUrl(fileKey: string): string {
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
  }
}
