import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { AppDataSource } from "../db/data-source";
import { Syllabus } from "../models/Syllabus";

const syllabusRepo = AppDataSource.getRepository(Syllabus);

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
      rawText = parsed.text;
    } else if (file.mimetype === "text/plain") {
      rawText = fs.readFileSync(filePath, "utf-8");
    } else {
      res.status(400).json({ error: "Unsupported file type" });
      return;
    }

    const syllabus = syllabusRepo.create({
      title,
      rawText,
      uploadedFileUrl: file.filename,
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
