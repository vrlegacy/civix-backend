const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authmiddleware");

const router = express.Router();

// Validation chains
const signupValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["citizen", "admin", "official", "volunteer"])
    .withMessage("Invalid role specified"),
];

const signinValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Register / Signup routes
router.post("/signup", signupValidation, authController.signup);
router.post("/register", signupValidation, authController.signup);
router.post("/verify-email", authController.verifyEmail);

// Login / Signin routes
router.post("/signin", signinValidation, authController.signin);
router.post("/login", signinValidation, authController.signin);

// Get current user info
router.get("/me", protect, authController.getMe);

// Logout route
router.post("/logout", authController.logout);

// Password Reset Request
router.post("/requestreset", authController.forgotPassword);
router.post("/forgot-password", authController.forgotPassword);

// Password Reset
router.post("/resetpassword", authController.resetPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
