const express = require("express");

const router = express.Router();

const uploadResume = require("../middleware/uploadResume");
const authMiddleware = require("../middleware/authMiddleware");

const {
  analyzeResumeController,
  getResumeHistory,
  getResumeById,
  deleteResume,
} = require("../controllers/resumeController");

router.post(
  "/analyze",
  authMiddleware,
  uploadResume.single("resume"),
  analyzeResumeController
);

router.get(
  "/history",
  authMiddleware,
  getResumeHistory
);

router.get(
  "/:id",
  authMiddleware,
  getResumeById
);

router.delete(
  "/:id",
  authMiddleware,
  deleteResume
);

module.exports = router;