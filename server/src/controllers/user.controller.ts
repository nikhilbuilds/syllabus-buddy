import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import { PushNotificationService } from "../services/pushNotification.service";
import { EmailService } from "../services/email.service";
import crypto from "crypto";

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
      select: [
        "id",
        "name",
        "email",
        "passwordHash",
        "isEmailVerified",
        "isOnboardingComplete",
        "emailVerificationToken",
        "emailVerificationExpires",
      ],
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

    // Check if user needs email verification
    let needsNewVerificationEmail = false;
    if (!user.isEmailVerified) {
      // Check if token is missing or expired
      if (
        !user.emailVerificationToken ||
        !user.emailVerificationExpires ||
        new Date() > user.emailVerificationExpires
      ) {
        needsNewVerificationEmail = true;
      }
    }

    // await PushNotificationService.sendPushNotification(
    //   user.id,
    //   "Welcome to Syllabus Buddy!",
    //   "We're excited to have you on board! Let's get started on your learning journey.",
    //   { test: true }
    // );

    console.log("user", user);

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        isOnboardingComplete: user.isOnboardingComplete,
        needsNewVerificationEmail,
      },
    });
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

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = await userRepo.findOne({
      where: { id: userId },
      select: [
        "id",
        "email",
        "name",
        "isEmailVerified",
        "isOnboardingComplete",
        "preferredLanguage",
      ],
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        isOnboardingComplete: user.isOnboardingComplete,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
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

    if (user.isEmailVerified) {
      res.status(400).json({ error: "Email already verified" });
      return;
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await userRepo.save(user);

    // Send verification email
    await EmailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );

    res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
};
