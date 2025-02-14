const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { User } = require("../models");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; // Use environment variable
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || "1h";

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many attempts, please try again later"
});

// Apply to all auth routes
router.use(authLimiter);

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 🟢 User Signup
router.post(
  "/signup",
  [
    body("name")
      .trim()
      .notEmpty().withMessage("Name is required")
      .isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
    body("email")
      .trim()
      .isEmail().withMessage("Valid email is required")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/[a-z]/).withMessage("Password must contain a lowercase letter")
      .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
      .matches(/\d/).withMessage("Password must contain a number"),
    body("contact")
      .optional()
      .trim()
      .matches(/^\+?[\d\s()-]{7,}$/).withMessage("Invalid phone number format")
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, contact } = req.body;

      // Check existing user using model's unique constraint
      const user = await User.findOne({ where: { email } });
      if (user) {
        return res.status(409).json({ error: "User already exists" });
      }

      // Create new user
      const newUser = await User.create({ name, email, password, contact });

      // Generate JWT Token
      const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { 
        expiresIn: TOKEN_EXPIRY 
      });

      // Set HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000 // 1 hour
      });

      res.status(201).json(newUser.toJSON());
    } catch (err) {
      // Handle Sequelize validation errors
      if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ error: "Email already registered" });
      }
      console.error("Signup Error:", err);
      res.status(500).json({ 
        error: "Registration failed",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      });
    }
  }
);

// 🟢 User Login
router.post(
  "/login",
  [
    body("email").trim().isEmail().normalizeEmail(),
    body("password").notEmpty()
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Use model's password check method
      const isMatch = await user.checkPassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT Token
      const token = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRY
      });

      // Set HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000 // 1 hour
      });

      res.json(user.toJSON());
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({
        error: "Authentication failed",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      });
    }
  }
);

module.exports = router;