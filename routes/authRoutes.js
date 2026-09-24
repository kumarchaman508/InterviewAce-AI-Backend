const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    forgotPassword,
    resetPassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// Test Route
// ==========================================

router.get("/", (req, res) => {
    res.send("Auth Route Working 🚀");
});

// ==========================================
// Public Routes
// ==========================================

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password/:token", resetPassword);

// ==========================================
// Protected Routes
// ==========================================

// Get Profile
router.get("/profile", authMiddleware, getProfile);

// Update Profile
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;