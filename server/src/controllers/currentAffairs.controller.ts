import { Request, Response } from "express";
import { CurrentAffairsService } from "../services/currentAffairs.service";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import { CurrentAffair } from "../models/CurrentAffair";
import { NotificationBatchService } from "../services/notificationBatch.service";

const userRepo = AppDataSource.getRepository(User);
const currentAffairRepo = AppDataSource.getRepository(CurrentAffair);

export const uploadCurrentAffairsPDF = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const file = (req as any).file;

    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const affairs = await CurrentAffairsService.processPDF(file);

    res.status(201).json({
      message: "Current affairs processed successfully",
      currentAffairs: affairs,
    });
  } catch (error) {
    console.error("Error uploading current affairs:", error);
    res.status(500).json({ error: "Failed to process current affairs" });
  }
};

export const createCurrentAffairsPDF = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const data = req.body;

    const notificationCurrentAffairs = data.currentAffairs.filter(
      (currentAffair) => currentAffair.isImportant
    );

    const currentAffairsArray = data.currentAffairs.map((currentAffair) => {
      return currentAffairRepo.create({
        id: currentAffair.id,
        headline: currentAffair.headline,
        summary: currentAffair.summary,
        keywords: currentAffair.keywords,
        relatedTopics: currentAffair.relatedTopics,
        publishedDate: new Date(),
        filePath: currentAffair.filePath,
        isImportant: currentAffair.isImportant,
        createdBy: userId,
      });
    });

    await currentAffairRepo.save(currentAffairsArray);

    //send notification to users
    NotificationBatchService.pushNotifications(notificationCurrentAffairs);

    res.status(201).json({
      message: "Current affairs saved successfully",
      currentAffairsArray,
    });
  } catch (error) {
    console.error("Error uploading current affairs:", error);
    res.status(500).json({ error: "Failed to process current affairs" });
  }
};

export const getAllCurrentAffairs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await CurrentAffairsService.getAllCurrentAffairs(
      page,
      limit
    );
    res.json(result);
  } catch (error) {
    console.error("Error fetching current affairs:", error);
    res.status(500).json({ error: "Failed to fetch current affairs" });
  }
};

export const getCurrentAffairById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const affair = await CurrentAffairsService.getCurrentAffairById(id);

    if (!affair) {
      res.status(404).json({ error: "Current affair not found" });
      return;
    }

    res.json(affair);
  } catch (error) {
    console.error("Error fetching current affair:", error);
    res.status(500).json({ error: "Failed to fetch current affair" });
  }
};

export const updateCurrentAffair = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const affair = await CurrentAffairsService.updateCurrentAffair(id, data);
    res.json(affair);
  } catch (error) {
    console.error("Error updating current affair:", error);
    res.status(500).json({ error: "Failed to update current affair" });
  }
};

export const deleteCurrentAffair = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await CurrentAffairsService.deleteCurrentAffair(id);
    res.json(result);
  } catch (error) {
    console.error("Error deleting current affair:", error);
    res.status(500).json({ error: "Failed to delete current affair" });
  }
};
