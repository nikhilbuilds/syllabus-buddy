import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";

const userRepo = AppDataSource.getRepository(User);

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await userRepo.findOne({
      where: { id: userId },
      select: { id: true, isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      res.status(403).json({ error: "Admin privileges required" });
      return;
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
