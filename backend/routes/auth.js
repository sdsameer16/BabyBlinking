import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// JWT token generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// nodemailer transporter (used unless SKIP_EMAIL=true)
const transporter = nodemailer.createTransport({
  service: "gmail", // or use SMTP server
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper to send OTP email
async function sendOtpEmail(to, otp) {
  const skip = String(process.env.SKIP_EMAIL || '').toLowerCase() === 'true';
  if (skip) {
    console.log("[EMAIL:SKIPPED] OTP for", to, "is", otp);
    return; // do not send email in dev when skipping
  }
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Baby Blink - Your OTP Code",
    text: `Your OTP code is: ${otp}. It expires in 10 minutes.`
  };
  await transporter.sendMail(mailOptions);
}

// Register route: create user (hashed password), store OTP and send email
router.post("/register", async (req, res) => {
  try {
    console.log("[REGISTER] body:", req.body);
    const { username, fullName, email, password, phoneNumber, babyName, babyAge, babyGender, address } = req.body;

    // normalize
    const usernameNorm = (username || "").trim();
    const emailNorm = (email || "").trim().toLowerCase();

    // simple checks
    if (!usernameNorm || !emailNorm || !password) {
      return res.status(400).json({ message: "username, email, password required" });
    }

    const exists = await User.findOne({ $or: [{ username: usernameNorm }, { email: emailNorm }] });
    console.log("[REGISTER] normalized:", { usernameNorm, emailNorm, exists: !!exists });
    if (exists) return res.status(400).json({ message: "Username or email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = new User({
      username: usernameNorm,
      fullName,
      email: emailNorm,
      password: hashed,
      phoneNumber, babyName, babyAge, babyGender, address,
      otp, otpExpires
    });

    await user.save();
    console.log("[REGISTER] user saved, sending OTP to:", emailNorm);
    // In dev, SKIP_EMAIL=true logs OTP in console
    await sendOtpEmail(emailNorm, otp);
    console.log("[REGISTER] OTP (for debugging):", otp);

    return res.status(201).json({ message: "Registered. OTP sent to email", email });
  } catch (err) {
    console.error("[REGISTER][ERROR]", err);
    return res.status(500).json({ error: err.message });
  }
});

// Verify OTP route
router.post("/verify-otp", async (req, res) => {
  try {
    console.log("[VERIFY-OTP] body:", req.body);
    const { email, otp } = req.body;
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified) return res.status(200).json({ message: "Already verified" });
    if (!user.otp || user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpires < Date.now()) return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    console.log("[VERIFY-OTP] verified for:", user.email);
    return res.json({ message: "Email verified" });
  } catch (err) {
    console.error("[VERIFY-OTP][ERROR]", err);
    return res.status(500).json({ error: err.message });
  }
});

// Resend OTP (optional)
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendOtpEmail(email, otp);
    return res.json({ message: "OTP resent to email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Login route: check username + password, ensure verified
router.post("/login", async (req, res) => {
  try {
    console.log("[LOGIN] body:", req.body);
    const { username, email, password } = req.body;
    if ((!username && !email) || !password) {
      return res.status(400).json({ message: "username/email & password required" });
    }

    // Determine identifier and lookup
    const query = email
      ? { email: String(email).trim().toLowerCase() }
      : { username: String(username).trim() };
    console.log("[LOGIN] query:", query);
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "Account not registered. Please register first." });
    if (!user.isVerified) return res.status(403).json({ message: "Email not verified (check your email for OTP)" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // success - generate token and return user info
    const token = generateToken(user._id);
    console.log("[LOGIN] success for:", { username: user.username, email: user.email });
    return res.json({
      message: "Login successful",
      token,
      user: { 
        id: user._id,
        username: user.username, 
        fullName: user.fullName, 
        email: user.email,
        babyName: user.babyName,
        babyAge: user.babyAge,
        babyGender: user.babyGender
      }
    });
  } catch (err) {
    console.error("[LOGIN][ERROR]", err);
    return res.status(500).json({ error: err.message });
  }
});

// Get user profile (protected route)
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    console.error("[PROFILE][ERROR]", err);
    res.status(500).json({ error: err.message });
  }
});

// Logout route (client-side token removal)
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
