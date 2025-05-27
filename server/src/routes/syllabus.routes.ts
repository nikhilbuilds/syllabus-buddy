import { Router } from "express";
import multer from "multer";
import { uploadSyllabus } from "../controllers/syllabus.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  getTopicsForSyllabus,
  parseTopics,
} from "../controllers/topic.controller";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.post("/upload", requireAuth, upload.single("file"), uploadSyllabus);
router.post("/:id/parse-topics", requireAuth, parseTopics);
router.get("/:id/topics", requireAuth, getTopicsForSyllabus);

export default router;
