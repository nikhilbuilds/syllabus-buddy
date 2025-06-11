import express from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {
  registerUser,
  loginUser,
  getProfile,
  forgotPassword,
  resetPassword,
  logoutUser,
  resendVerificationEmail,
  subscribe,
} from "../controllers/user.controller";
import { handleSocialLogin } from "../controllers/social.controller";

const router = express.Router();

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/social", handleSocialLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/logout", logoutUser);
router.post("/resend-verification", authenticateToken, resendVerificationEmail);
router.get("/profile", authenticateToken, getProfile);
// router.put("/profile", authenticateToken, updateProfile);

router.post("/subscribe", subscribe);

export default router;
