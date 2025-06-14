import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { AppDataSource } from "../db/data-source";
import { Syllabus, SyllabusStatus } from "../models/Syllabus";
import { UploadType } from "../constants/uploadType";
import { extractTextFromFile } from "../services/llmTextExtractor.service";
import { SyllabusQueueService } from "../services/syllabusQueue.service";
import { User } from "../models/User";
import { LogSource } from "../models/Log";
import { LoggingService } from "../services/logging.service";
import { LogLevel } from "../models/Log";
import { getFileContent } from "../services/getFileContent.service";

const syllabusRepo = AppDataSource.getRepository(Syllabus);
const userRepo = AppDataSource.getRepository(User);

export const uploadSyllabus = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const title = req.body.title || file.originalname;
  const filePath = path.resolve(file.path);
  let rawText = "";

  try {
    if (file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(dataBuffer);
      rawText = parsed.text.replace(/\x00/g, "").trim();
    } else if (file.mimetype === "text/plain") {
      rawText = fs.readFileSync(filePath, "utf-8").replace(/\x00/g, "").trim();
    }

    // If text is empty, fallback to LLM extraction
    if (!rawText || rawText.length < 50) {
      console.log("Falling back to LLM text extraction...");
      rawText = await extractTextFromFile(file.buffer, file.mimetype);
    }

    {
      /*
      //1. Check chunk size
        //2. If chunk size is more than 60000,
        //3. Call enqueueSyllabusProcessing - queue service
        //4. Notify user
      
      //2. If chunk size is less than 60000,
        //1. Continue with syllabus creation
      */
    }

    // await SyllabusQueueService.enqueueSyllabusProcessing({
    //   syllabusId: savedSyllabus.id,
    //   user,
    //   filePath,
    //   preferredLanguage,
    // });+

    const syllabus = syllabusRepo.create({
      title,
      rawText,
      filePath: file.filename,
      preferredLanguage: req.body.preferredLanguage,
      uploadType: UploadType.FILE,
      user: { id: userId },
    });

    await syllabusRepo.save(syllabus);

    res
      .status(201)
      .json({ message: "Syllabus uploaded", syllabusId: syllabus.id });
    return;
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload syllabus" });
    return;
  }
};

export const uploadSyllabusQueue = async (req: Request, res: Response) => {
  try {
    const { title, dailyStudyMinutes, preferredLanguage } = req.body;
    const userId = (req as any).userId;
    const file = (req as any).file;

    if (!title) {
      res.status(400).json({
        success: false,
        message: "Title is required",
      });
      return;
    }

    const user = await userRepo.findOne({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    let rawText = "";

    try {
      // First try direct parsing for PDF and text files
      if (file.mimetype === "application/pdf") {
        const fileBuffer = await getFileContent(file.location);
        const parsed = await pdfParse(fileBuffer);
        rawText = parsed.text.replace(/\x00/g, "").trim();
      } else if (file.mimetype === "text/plain") {
        rawText = file.buffer.toString("utf-8").replace(/\x00/g, "").trim();
      }

      // If direct parsing failed or for images, use LLM extraction
      if (!rawText || rawText.length < 50) {
        console.log("Using LLM for text extraction...");
        rawText = await extractTextFromFile(file.buffer, file.mimetype);
      }

      // Final validation of extracted text
      if (!rawText || rawText.length < 50) {
        res.status(400).json({
          success: false,
          message:
            "Could not extract meaningful text from the file. Please try a different file.",
        });
        return;
      }

      // Create syllabus record with PENDING status
      const syllabus = await syllabusRepo.save({
        title,
        status: SyllabusStatus.PENDING,
        filePath: file.location,
        user: user,
        uploadType: UploadType.FILE,
        dailyStudyMinutes,
        preferredLanguage,
        rawText, // Store the extracted text
      });

      // Log the upload action
      await LoggingService.log(
        LogLevel.INFO,
        LogSource.SYLLABUS_UPLOAD,
        "Syllabus upload initiated",
        {
          userId,
          syllabusId: syllabus.id,
          title,
          fileType: file.mimetype,
        }
      );

      // Enqueue the syllabus for processing
      SyllabusQueueService.enqueueSyllabusProcessing({
        syllabusId: syllabus.id,
        user,
        filePath: file.key,
      });

      res.status(201).json({
        success: true,
        message: "Syllabus uploaded successfully",
        data: {
          syllabusId: syllabus.id,
        },
      });
      return;
    } catch (extractionError) {
      console.error("Error extracting text:", extractionError);
      res.status(400).json({
        success: false,
        message:
          "Failed to extract text from the file. Please try a different file.",
        error:
          extractionError instanceof Error
            ? extractionError.message
            : "Unknown error",
      });
      return;
    }
  } catch (error) {
    console.error("Error in uploadSyllabusQueue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process syllabus upload",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return;
  }
};

export const createSyllabus = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { title, description, preferredLanguage, dailyStudyMinutes } = req.body;

  const user = await userRepo.findOne({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

  const syllabus = syllabusRepo.create({
    title,
    rawText: description,
    preferredLanguage,
    uploadType: UploadType.MANUAL,
    user: { id: userId },
    dailyStudyMinutes,
  });

  await syllabusRepo.save(syllabus);

  await SyllabusQueueService.enqueueSyllabusProcessing({
    syllabusId: syllabus.id,
    user,
  });

  res
    .status(201)
    .json({ message: "Syllabus created", syllabusId: syllabus.id });
  return;
};

export const getSyllabus = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const syllabus = await syllabusRepo.find({
    where: { user: { id: userId } },
    select: {
      id: true,
      title: true,
      preferredLanguage: true,
      processingState: true,
    },
  });
  res.json(syllabus);
  return;
};

export const deleteSyllabus = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const syllabusId = parseInt(req.params.id);

  try {
    const result = await syllabusRepo.softRemove({
      id: syllabusId,
      user: { id: userId },
    });

    console.log("result", result);

    if (result) {
      res.status(404).json({ error: "Syllabus not found" });
      return;
    }

    res.status(200).json({ message: "Syllabus deleted successfully" });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Failed to delete syllabus" });
    return;
  }
};

export const renameSyllabus = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const syllabusId = parseInt(req.params.id);
  const { title } = req.body;

  try {
    const result = await syllabusRepo.update(
      { id: syllabusId, user: { id: userId } },
      { title }
    );

    if (result.affected === 0) {
      res.status(404).json({ error: "Syllabus not found" });
      return;
    }

    res.status(200).json({ message: "Syllabus renamed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to rename syllabus" });
    return;
  }
};

export const getSyllabusById = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const syllabusId = parseInt(req.params.id);

  try {
    const syllabus = await syllabusRepo.findOne({
      where: {
        id: syllabusId,
        user: { id: userId },
      },
      select: {
        id: true,
        title: true,
        processingState: true,
      },
    });

    if (!syllabus) {
      res.status(404).json({ error: "Syllabus not found" });
      return;
    }

    res.json(syllabus);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch syllabus" });
    return;
  }
};
