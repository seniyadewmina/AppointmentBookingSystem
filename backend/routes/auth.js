const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { User } = require("../models");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET; // Use environment variable
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || "1h";

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { 
      expiresIn: TOKEN_EXPIRY 
    });
};

const formatResponse = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    contact: user.contact
  });

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many attempts, please try again later"
});
const authErrors = {
    invalidCredentials: "Invalid email or password",
    emailExists: "Email already registered",
    weakPassword: "Password does not meet requirements"
  
};

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
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
      .withMessage("Password must contain uppercase, lowercase, and number"),
    body("contact")
      .optional()
      .trim()
      .matches(/^\+?[\d\s()-]{7,}$/).withMessage("Invalid phone number format"),
    body("passwordConfirm")
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Passwords do not match")
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password, contact } = req.body;

      // Check existing user using model's unique constraint
      const user = await User.findOne({ where: { email } });
      if (user) {
        return res.status(409).json({ error: authErrors.emailExists });
      }

      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashedPassword, contact });

      // Generate JWT Token
      const token = generateToken(newUser.id);

      // Set HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600000
      });

      res.status(201).json(formatResponse(newUser));
    } catch (err) {
      // Handle Sequelize validation errors
      if (err.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ error: authErrors.emailExists });
      }
      console.error("Signup Error:", err);
      res.status(500).json({ error: "Registration failed",
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
      if (!User) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Use model's password check method
      const isMatch = await user.checkPassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT Token
      const token = generateToken(User.id);

      // Set HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600000
      });

      res.json(formatResponse(user));
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({
        error: "Authentication failed",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      });
    }
  }
);

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Successfully logged out" });
  }
);

router.post("/refresh", async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "No token provided" });
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const newToken = generateToken(decoded.id);
      
      res.cookie("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000
      });
  
      res.json({ message: "Token refreshed" });
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  }
);

module.exports = router;