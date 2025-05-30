import { Request, Response } from "express";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { EmailService } from "../services/email.service";

const userRepo = AppDataSource.getRepository(User);

export const initiateRegistration = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    // Check if user already exists
    const existingUser = await userRepo.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = userRepo.create({
      email,
      name,
      passwordHash,
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: false,
      isOnboardingComplete: false,
    });

    await userRepo.save(user);

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    await EmailService.sendVerificationEmail(email, name, verificationLink);

    res.status(201).json({
      success: true,
      message:
        "Registration initiated. Please check your email for verification link.",
      userId: user.id,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    console.log("=== VERIFY EMAIL REQUEST ===");
    console.log("Method:", req.method);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Query:", req.query);
    console.log("Params:", req.params);

    const { token } = req.body;

    if (!token) {
      console.log("No token provided in request");
      res.status(400).json({ error: "Token is required" });
      return;
    }

    console.log("token----------->", token);
    const user = await userRepo.findOne({
      where: {
        emailVerificationToken: token,
      },
    });

    if (
      !user ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      res.status(400).json({ error: "Invalid or expired verification token" });
      return;
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await userRepo.save(user);

    // Generate JWT token
    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Email verified successfully",
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isOnboardingComplete: user.isOnboardingComplete,
      },
    });
  } catch (error: any) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const completeOnboarding = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      age,
      currentOccupation,
      preferredLanguage,
      learningGoals,
      targetExam,
      additionalNotes,
    } = req.body;

    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(400).json({ error: "Please verify your email first" });
      return;
    }

    // Update user with onboarding data
    user.age = age;
    user.currentOccupation = currentOccupation;
    user.preferredLanguage = preferredLanguage || "en";
    user.learningGoals = learningGoals;
    user.targetExam = targetExam;
    user.additionalNotes = additionalNotes;
    user.isOnboardingComplete = true;

    await userRepo.save(user);

    res.json({
      success: true,
      message: "Onboarding completed successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        currentOccupation: user.currentOccupation,
        preferredLanguage: user.preferredLanguage,
        targetExam: user.targetExam,
        isOnboardingComplete: user.isOnboardingComplete,
      },
    });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getOnboardingStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        isEmailVerified: user.isEmailVerified,
        isOnboardingComplete: user.isOnboardingComplete,
        hasBasicInfo: !!(user.age && user.currentOccupation),
        targetExam: user.targetExam,
      },
    });
  } catch (error: any) {
    console.error("Get onboarding status error:", error);
    res.status(500).json({ error: error.message });
  }
};
