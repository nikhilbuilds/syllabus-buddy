import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import { PushNotificationService } from "../services/pushNotification.service";

const userRepo = AppDataSource.getRepository(User);

export const registerUser = async (req: Request, res: Response) => {
  const { email, password, name, dailyMinutes } = req.body;

  try {
    const existing = await userRepo.findOneBy({ email });
    if (existing) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = userRepo.create({ email, passwordHash, name, dailyMinutes });
    await userRepo.save(user);

    res.status(201).json({ message: "User registered successfully" });
    return;
  } catch (err) {
    res.status(500).json({ error: "Server error" });
    return;
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await userRepo.findOne({
      where: { email },
      select: ["id", "name", "email", "passwordHash"],
    });

    if (!user) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await PushNotificationService.sendPushNotification(
      user.id,
      "Welcome to Syllabus Buddy!",
      "We're excited to have you on board! Let's get started on your learning journey.",
      { test: true }
    );

    res
      .status(200)
      .json({ user: { id: user.id, name: user.name, email: user.email } });

    return;
  } catch (err) {
    res.status(500).json({ error: "Server error" });
    return;
  }
};

export const logoutUser = (req: Request, res: Response) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
  return;
};

export const getUser = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = await userRepo.findOneBy({ id: userId });
  res.status(200).json({ user });
  return;
};
