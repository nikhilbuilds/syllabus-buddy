import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  getProfile,
  resendVerificationEmail,
} from "../controllers/user.controller";
import { handleSocialLogin } from "../controllers/social.controller";
import { requireAuth } from "../middlewares/auth.middleware";
const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/social", handleSocialLogin);
router.post("/logout", logoutUser);
router.get("/profile", requireAuth, getProfile);
router.get("/", requireAuth, getUser);
router.post("/resend-verification", requireAuth, resendVerificationEmail);
export default router;
