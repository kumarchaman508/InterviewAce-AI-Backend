const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  startInterview,
  submitInterview,
  getInterviewHistory,
  getAnalytics,
} = require("../controllers/interviewController");

// =============================
// Start Interview
// =============================
router.post(
  "/start",
  authMiddleware,
  startInterview
);

// =============================
// Submit Interview
// =============================
router.post(
  "/submit",
  authMiddleware,
  submitInterview
);

// =============================
// Interview History
// =============================
router.get(
  "/history",
  authMiddleware,
  getInterviewHistory
);

// =============================
// Interview Analytics
// =============================
router.get(
  "/analytics",
  authMiddleware,
  getAnalytics
);

module.exports = router;