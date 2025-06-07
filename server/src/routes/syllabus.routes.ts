import { Router } from "express";
import uploadMiddleware from "../middleware/upload.middleware";
import { validateFileType } from "../middleware/fileValidation.middleware";
import { errorHandler } from "../middleware/error.middleware";
import {
  uploadSyllabus,
  uploadSyllabusQueue,
  createSyllabus,
  getSyllabus,
  deleteSyllabus,
  renameSyllabus,
  getSyllabusById,
} from "../controllers/syllabus.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { getTopicsForSyllabus } from "../controllers/topic.controller";

const router = Router();

router.post(
  "/upload",
  authenticateToken,
  uploadMiddleware.single("file"),
  validateFileType,
  uploadSyllabus,
  errorHandler
);

router.post(
  "/upload/queue",
  authenticateToken,
  validateFileType,
  uploadMiddleware.single("file"),
  uploadSyllabusQueue,
  errorHandler
);

router.post("/create", authenticateToken, createSyllabus, errorHandler);
router.get("/", authenticateToken, getSyllabus, errorHandler);
router.delete("/:id", authenticateToken, deleteSyllabus, errorHandler);
router.put("/:id/rename", authenticateToken, renameSyllabus, errorHandler);
router.get("/:id", authenticateToken, getSyllabusById, errorHandler);
router.get(
  "/:id/topics",
  authenticateToken,
  getTopicsForSyllabus,
  errorHandler
);

// router.post("/upload", requireAuth, upload.single("file"), uploadSyllabus);
// router.post(
//   "/upload-queue",
//   requireAuth,
//   upload.single("file"),
//   uploadSyllabusQueue
// );
// router.post("/create", requireAuth, createSyllabus);
// router.post("/:id/parse-topics", requireAuth, parseTopics);
// router.get("/", requireAuth, getSyllabus);
// router.delete("/:id", requireAuth, deleteSyllabus);
// router.patch("/:id", requireAuth, renameSyllabus);
// router.get("/:id", requireAuth, getSyllabusById);
// router.get("/:id/topics", requireAuth, getTopicsForSyllabus);

// router.get("/", authenticateToken, getAllSyllabi);
// router.post("/:id/parse-topics", authenticateToken, parseTopics);

export default router;
