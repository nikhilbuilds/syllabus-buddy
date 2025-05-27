import { Router } from "express";
import { getTodayDashboard } from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/today", requireAuth, getTodayDashboard);

export default router;
