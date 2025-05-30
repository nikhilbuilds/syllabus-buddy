import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";

const userRepo = AppDataSource.getRepository(User);

export const requireEmailVerification = async (
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

    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        error: "Email verification required for this feature",
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email to access this feature",
        user,
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Email verification middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
