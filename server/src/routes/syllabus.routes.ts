import { Router } from "express";
import multer from "multer";
import {
  getSyllabus,
  uploadSyllabus,
  deleteSyllabus,
  renameSyllabus,
  getSyllabusById,
  createSyllabus,
} from "../controllers/syllabus.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  getTopicsForSyllabus,
  parseTopics,
} from "../controllers/topic.controller";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.post("/upload", requireAuth, upload.single("file"), uploadSyllabus);
router.post("/create", requireAuth, createSyllabus);
router.post("/:id/parse-topics", requireAuth, parseTopics);
router.get("/", requireAuth, getSyllabus);
router.delete("/:id", requireAuth, deleteSyllabus);
router.patch("/:id", requireAuth, renameSyllabus);
router.get("/:id", requireAuth, getSyllabusById);
router.get("/:id/topics", requireAuth, getTopicsForSyllabus);

export default router;
