const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ==============================
// POST /api/auth/register
// ==============================
router.post("/register", async (req, res) => {
  try {
    const { fullName, username, emailOrPhone, password } = req.body;

    if (!fullName || !username || !emailOrPhone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if username or email/phone already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { emailOrPhone }]
    });
    if (existingUser) {
      return res.status(400).json({ message: "Username or Email/Phone already taken" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      username,
      emailOrPhone,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// POST /api/auth/login
// ==============================
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body; // username OR emailOrPhone

    if (!identifier || !password) {
      return res.status(400).json({ message: "Username/email/phone and password are required" });
    }

    // Find user by username OR emailOrPhone
    const user = await User.findOne({
      $or: [{ username: identifier }, { emailOrPhone: identifier }]
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid username/email/phone or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username/email/phone or password" });
    }

    //  Generate JWT token
    const token = jwt.sign({ id: user._id }, "tezricsupersecretkey", { expiresIn: "70d" });

    res.status(200).json({ message: "Login successful", user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
