import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { AppDataSource } from "../db/data-source";
import { Syllabus } from "../models/Syllabus";
import { UploadType } from "../constants/uploadType";

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
      rawText = parsed.text.replace(/\x00/g, "");
    } else if (file.mimetype === "text/plain") {
      rawText = fs.readFileSync(filePath, "utf-8").replace(/\x00/g, "");
    }

    const syllabus = syllabusRepo.create({
      title,
      rawText,
      uploadedFileUrl: file.filename,
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

export const createSyllabus = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { title, description, preferredLanguage } = req.body;

  const syllabus = syllabusRepo.create({
    title,
    rawText: description,
    preferredLanguage,
    uploadType: UploadType.MANUAL,
    user: { id: userId },
  });

  await syllabusRepo.save(syllabus);

  res
    .status(201)
    .json({ message: "Syllabus created", syllabusId: syllabus.id });
  return;
};

export const getSyllabus = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const syllabus = await syllabusRepo.find({
    where: { user: { id: userId } },
    select: { id: true, title: true, preferredLanguage: true },
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
        rawText: true,
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
