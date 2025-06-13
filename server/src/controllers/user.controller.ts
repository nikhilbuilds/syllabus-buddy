import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import { Subscribe } from "../models/Subscribe";
import { EmailService } from "../services/email.service";
import crypto from "crypto";
import { createLog } from "../services/log.service";
import { LogSource } from "../models/Log";
import { MoreThan } from "typeorm";

const userRepo = AppDataSource.getRepository(User);
const subscribeRepo = AppDataSource.getRepository(Subscribe);

export const subscribe = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  // basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }

  try {
    const existing = await subscribeRepo.findOneBy({ email });
    if (existing) {
      res.status(400).json({ error: "Email already subscribed" });
      return;
    }

    const subscription = subscribeRepo.create({ email });
    await subscribeRepo.save(subscription);

    res.status(201).json({ message: "Subscribed successfully" });
    return;
  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ error: "Server error" });
    return;
  }
};

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
        "preferredLanguage",
      ],
    });

    if (!user) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(400).json({ error: "Invalid email or password" });
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
        preferredLanguage: user.preferredLanguage,
      },
    });
    return;
  } catch (err) {
    res.status(500).json({ error: "Server error" });
    return;
  }
};

export const logoutUser = (_req: Request, res: Response) => {
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

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const user = await userRepo.findOne({ where: { email } });

    if (!user) {
      // Return success even if user doesn't exist for security
      res.status(200).json({
        message:
          "If an account exists with this email, you will receive a password reset link",
      });
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    // Store reset token in user record
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    await userRepo.save(user);

    // Send reset email
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await EmailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken
    );

    await createLog({
      userId: user.id,
      source: LogSource.USER,
      message: "Password reset requested",
      metadata: { email: user.email },
    });

    res.status(200).json({
      message:
        "If an account exists with this email, you will receive a password reset link",
    });
    return;
  } catch (error) {
    console.error("Forgot password error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while processing your request" });
    return;
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: "Token and password are required" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as { userId: number };

    const user = await userRepo.findOne({
      where: {
        id: decoded.userId,
        resetToken: token,
        resetTokenExpiry: MoreThan(new Date()),
      },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and clear reset token
    user.passwordHash = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await userRepo.save(user);

    await createLog({
      userId: user.id,
      source: LogSource.USER,
      message: "Password reset completed",
      metadata: { email: user.email },
    });

    res.status(200).json({ message: "Password has been reset successfully" });
    return;
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(500)
      .json({ message: "An error occurred while resetting your password" });
    return;
  }
};
