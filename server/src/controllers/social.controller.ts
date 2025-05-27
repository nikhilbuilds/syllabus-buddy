import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../db/data-source";
import { User } from "../models/User";
import { UserAuth } from "../models/UserAuth";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userRepo = AppDataSource.getRepository(User);
const authRepo = AppDataSource.getRepository(UserAuth);

export const handleSocialLogin = async (req: Request, res: Response) => {
  const { provider, token } = req.body;

  if (provider === "google") {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const providerUserId = payload?.sub;
      const email = payload?.email;
      const name = payload?.name;

      if (!providerUserId || !email) {
        res.status(400).json({ error: "Invalid Google token" });
        return;
      }

      // Check if social login exists
      let userAuth = await authRepo.findOne({
        where: { provider: "google", providerUserId },
        relations: ["user"],
      });

      let user: User;

      if (!userAuth) {
        // Check if email exists to avoid duplicate users
        const existingUser = await userRepo.findOneBy({ email });

        user =
          existingUser || userRepo.create({ email, name, dailyMinutes: 10 });
        if (!existingUser) await userRepo.save(user);

        // Save userAuth
        userAuth = authRepo.create({
          provider: "google",
          providerUserId,
          user,
        });
        await authRepo.save(userAuth);
      } else {
        user = userAuth.user;
      }

      const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });
      res.cookie("token", jwtToken, {
        httpOnly: true, // JavaScript can't access this cookie (prevents XSS)
        secure: process.env.NODE_ENV === "production", // HTTPS only in prod
        sameSite: "strict", // Prevents CSRF in most cases
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res
        .status(200)
        .json({ user: { id: user.id, name: user.name, email: user.email } });
      return;
    } catch (err) {
      console.error("Social login error:", err);
      res.status(401).json({ error: "Social auth failed" });
      return;
    }
  } else {
    res.status(400).json({ error: "Unsupported provider" });
    return;
  }
};
