import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
} from "../controllers/user.controller";
import { handleSocialLogin } from "../controllers/social.controller";
import { requireAuth } from "../middlewares/auth.middleware";
const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/social", handleSocialLogin);
router.post("/logout", logoutUser);
router.get("/", requireAuth, getUser);
export default router;
