const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const PendingUser = require("../models/PendingUser");
const Blacklist = require("../models/blacklist");
const { sendResetEmail, sendVerificationEmail } = require("../utils/sendEmail");

// Helper to generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user._id || user.id,
    role: user.role,
  };
  const secret = process.env.JWT_SECRET || process.env.jwtsecret;
  return jwt.sign(payload, secret, {
    expiresIn: "24h",
  });
};

// @desc    Register a new user (Creates pending user and sends verification link)
// @route   POST /api/auth/signup or /api/auth/register
// @access  Public
exports.signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, password, role, location, latitude, longitude } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Clean up existing pending registration for this email
    await PendingUser.deleteMany({ email: email.toLowerCase() });

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if we should bypass verification (e.g. on Render free tier due to SMTP blocks)
    const bypassVerification = process.env.BYPASS_EMAIL_VERIFICATION === "true";

    if (bypassVerification) {
      // Create verified user directly
      user = new User({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || "citizen",
        location,
        latitude,
        longitude,
      });

      await user.save();

      return res.status(201).json({
        message: "User registered successfully!",
        success: true,
        requiresVerification: false,
      });
    }

    // Generate token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Save as pending user
    const pendingUser = new PendingUser({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "citizen",
      location,
      latitude,
      longitude,
      token: verificationToken,
    });

    await pendingUser.save();

    // Send verification email (asynchronously to avoid blocking the response)
    sendVerificationEmail(pendingUser.email, pendingUser.name, verificationToken)
      .catch(err => console.error("Failed to send verification email:", err.message || err));

    res.status(201).json({
      message: "Verification link sent to user's email.",
      success: true,
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// @desc    Verify email & create the user account
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    // Find pending user with matching token
    const pendingUser = await PendingUser.findOne({ token });
    if (!pendingUser) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    // Check if verified user exists
    let user = await User.findOne({ email: pendingUser.email });
    if (user) {
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return res.status(400).json({ message: "User already exists and is verified." });
    }

    // Create verified user
    user = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      role: pendingUser.role,
      location: pendingUser.location,
      latitude: pendingUser.latitude,
      longitude: pendingUser.longitude,
    });

    await user.save();

    // Delete pending record
    await PendingUser.deleteOne({ _id: pendingUser._id });

    // Generate token
    const jwtToken = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Email verified and user account created successfully!",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("Verification error:", error.message);
    res.status(500).json({ message: "Server error during verification" });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin or /api/auth/login
// @access  Public
exports.signin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("Signin error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Request password reset link
// @route   POST /api/auth/forgot-password or /api/auth/requestreset
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return 200 for security reasons
      return res.status(200).json({
        success: true,
        message: "If your email exists, you will receive a password reset link",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 60 mins

    user.resetToken = resetToken;
    user.resetTokenExpiry = tokenExpiry;
    await user.save();

    // Send reset email (asynchronously to avoid blocking the response)
    sendResetEmail(user.email, user.name, resetToken)
      .catch(err => console.error("Failed to send reset email:", err.message || err));

    return res.status(200).json({
      success: true,
      message: "If your email exists, you will receive a password reset link",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later",
    });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password or /api/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new password",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later",
    });
  }
};

// @desc    Logout user / blacklist token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const header = req.headers["authorization"];
    if (header) {
      const token = header.split(" ")[1];
      if (token) {
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const blacklisted = new Blacklist({ token, expiry });
        await blacklisted.save();
      }
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        location: req.user.location,
      },
    });
  } catch (error) {
    console.error("GetMe error:", error.message);
    res.status(500).json({ error: "Server error fetching user details" });
  }
};
