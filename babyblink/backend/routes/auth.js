import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const router = express.Router();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email with retry logic
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transporter = createTransporter();
      await transporter.verify();
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent on attempt ${attempt}`);
      return info;
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  throw lastError;
};

// Helper: generate OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send verification email
const sendVerificationEmail = async (email, otp, name) => {
  const mailOptions = {
    from: {
      name: "KinderKares Baby Blink",
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: "🍼 Verify Your Baby Blink Registration",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4CAF50; margin: 0;">Welcome to Baby Blink! 👶</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; color: white; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0 0 20px 0;">Email Verification Required</h2>
          <p style="margin: 0; font-size: 16px;">Hi ${name}!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
            Thank you for registering with Baby Blink. To complete your registration, please verify your email address using the verification code below:
          </p>
          
          <div style="background: white; padding: 25px; text-align: center; margin: 25px 0; border-radius: 10px; border: 3px solid #4CAF50;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: bold;">VERIFICATION CODE</p>
            <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              ⏰ <strong>This verification code will expire in 15 minutes.</strong>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated email from KinderKares Baby Blink.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
    text: `Welcome to Baby Blink! Hi ${name}, Your verification code is: ${otp}. This code will expire in 15 minutes.`
  };

  return await sendEmailWithRetry(mailOptions);
};

// ✅ Test email route
router.post("/test-email", async (req, res) => {
  try {
    console.log("🧪 Testing email configuration...");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Present" : "Missing");
    
    const testEmail = {
      from: {
        name: "KinderKares Test",
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER,
      subject: "🧪 Test Email - Baby Blink",
      html: `
        <h2>Test Email Success! ✅</h2>
        <p>If you receive this email, your email configuration is working correctly!</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
      text: `Test email sent at ${new Date().toISOString()}`
    };

    const info = await sendEmailWithRetry(testEmail);
    
    res.json({ 
      success: true,
      message: "Test email sent successfully!", 
      messageId: info.messageId
    });
  } catch (error) {
    console.error("❌ Test email failed:", error);
    res.status(500).json({ 
      success: false,
      error: "Test email failed", 
      details: error.message
    });
  }
});

// ✅ Register route
router.post("/register", async (req, res) => {
  try {
    console.log("📝 Registration request received");
    console.log("Request body:", req.body);

    const { 
      username, 
      fullName, 
      email, 
      password, 
      phoneNumber, 
      babyName,
      babyAge, 
      babyGender, 
      address 
    } = req.body;

    console.log(`📝 Registration attempt for: ${email}`);

    // Validation
    if (!username || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ 
        error: "Username, email and password are required" 
      });
    }

    if (!isValidEmail(email)) {
      console.log("❌ Invalid email format");
      return res.status(400).json({ error: "Please enter a valid email" });
    }

    if (password.length < 6) {
      console.log("❌ Password too short");
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }

    console.log("✅ Validation passed");

    // Check if user already exists
    console.log("🔍 Checking if user exists...");
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      console.log("❌ User already exists");
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email already registered" });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    console.log("✅ User doesn't exist, proceeding...");

    // Hash password
    console.log("🔒 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed");
    
    // Generate OTP
    const otp = generateOtp();
    console.log(`🔢 Generated OTP: ${otp}`);

    // Create new user
    console.log("👤 Creating new user...");
    const user = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      babyName,
      babyAge: babyAge ? parseInt(babyAge) : undefined,
      babyGender,
      address,
      otp,
      otpExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
      isVerified: false
    });

    await user.save();
    console.log(`✅ User saved to database: ${email}`);

    // Send verification email
    console.log("📧 Sending verification email...");
    try {
      await sendVerificationEmail(email, otp, fullName || username);
      console.log(`✅ Verification email sent to ${email}`);
      
      res.status(201).json({ 
        message: "Registration successful! Please check your email for the verification code.",
        email: email
      });

    } catch (emailError) {
      console.error(`❌ Failed to send verification email:`, emailError);
      
      // Delete the user if email sending fails
      await User.findByIdAndDelete(user._id);
      console.log(`🗑️ Deleted user due to email failure: ${email}`);
      
      return res.status(500).json({ 
        error: "Unable to send verification email. Please try again."
      });
    }

  } catch (err) {
    console.error("❌ Registration error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Registration failed. Please try again.",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ✅ Verify OTP route
router.post("/verify-otp", async (req, res) => {
  try {
    console.log("🔍 OTP verification request received");
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.json({ message: "Email already verified" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    console.log(`✅ Email verified for user: ${user.email}`);
    res.json({ message: "Email verified successfully! You can now login." });

  } catch (err) {
    console.error("❌ Verify OTP error:", err);
    res.status(500).json({ error: "OTP verification failed. Please try again." });
  }
});

// ✅ Resend OTP route
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Generate new OTP
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    console.log(`🔄 Resending OTP to ${email}: ${otp}`);

    // Send new OTP email
    const mailOptions = {
      from: {
        name: "KinderKares Baby Blink",
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: "🍼 Your New Verification Code - Baby Blink",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin: 0;">New Verification Code 🔄</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px;">
            <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
              Hi ${user.fullName || user.username},
            </p>
            <p style="color: #333; margin: 0 0 25px 0;">
              Here's your new verification code:
            </p>
            
            <div style="background: white; padding: 25px; text-align: center; margin: 25px 0; border-radius: 10px; border: 3px solid #4CAF50;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: bold;">NEW VERIFICATION CODE</p>
              <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⏰ <strong>This new code will expire in 15 minutes.</strong>
              </p>
            </div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <div style="text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              KinderKares Baby Blink System
            </p>
          </div>
        </div>
      `,
      text: `New Verification Code for Baby Blink: ${otp}. This code will expire in 15 minutes.`
    };

    await sendEmailWithRetry(mailOptions);
    res.json({ message: "New verification code sent to your email!" });

  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    res.status(500).json({ error: "Failed to resend verification code" });
  }
});

// ✅ Login route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Support login with either username or email
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username }  // Allow email as username
      ]
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 🚫 CHECK IF USER IS BLOCKED BY ADMIN
    if (user.isBlocked) {
      console.log(`🚫 Blocked user attempted login: ${user.email} - Reason: ${user.blockReason}`);
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended. Please contact support for assistance.',
        blocked: true,
        reason: user.blockReason || 'Account suspended by administrator',
        blockedAt: user.blockedAt
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        error: "Please verify your email first. Check your inbox for the verification code.",
        needsVerification: true,
        email: user.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        email: user.email 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "24h" }
    );

    res.json({ 
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
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ✅ Health check
router.get("/health", (req, res) => {
  res.json({ 
    message: "Auth service is running",
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});
// ... all your existing routes (register, verify-otp, resend-otp, login, health) ...

// Add these NEW routes before the export
// ✅ Forgot Password - Send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    console.log("🔑 Forgot password request received");
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: "Email is required" 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false,
        error: "Please enter a valid email address" 
      });
    }

    console.log(`🔍 Checking if user exists: ${email}`);

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      return res.status(404).json({ 
        success: false,
        error: "No account found with this email address" 
      });
    }

    console.log(`✅ User found: ${user.username}`);

    // Generate OTP for password reset
    const otp = generateOtp();
    
    // Set OTP and expiration (15 minutes)
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    console.log(`🔢 Password reset OTP generated for ${email}: ${otp}`);

    // Send password reset email
    const mailOptions = {
      from: {
        name: "KinderKares Baby Blink",
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: "🔐 Reset Your Baby Blink Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ff6b6b; margin: 0;">Password Reset Request 🔐</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; color: white; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0 0 20px 0;">Reset Your Password</h2>
            <p style="margin: 0; font-size: 16px;">Hi ${user.fullName || user.username}!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; color: #333; font-size: 16px;">
              You requested to reset your password for your Baby Blink account. Use the verification code below to proceed:
            </p>
            
            <div style="background: white; padding: 25px; text-align: center; margin: 25px 0; border-radius: 10px; border: 3px solid #ff6b6b;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; font-weight: bold;">PASSWORD RESET CODE</p>
              <h1 style="color: #ff6b6b; font-size: 32px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h1>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⏰ <strong>This code will expire in 15 minutes.</strong>
              </p>
            </div>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #721c24; font-size: 14px;">
                🚨 <strong>If you didn't request this password reset, please ignore this email.</strong>
              </p>
            </div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <div style="text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated email from KinderKares Baby Blink.<br>
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `Password Reset Request. Hi ${user.fullName || user.username}, Your password reset code is: ${otp}. This code will expire in 15 minutes.`
    };

    try {
      await sendEmailWithRetry(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      
      res.json({ 
        success: true,
        message: "Password reset code sent to your email. Please check your inbox.",
        email: email
      });
    } catch (emailError) {
      console.error(`❌ Failed to send password reset email to ${email}:`, emailError);
      res.status(500).json({ 
        success: false,
        error: "Unable to send password reset email. Please try again." 
      });
    }

  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Password reset request failed. Please try again." 
    });
  }
});

// ✅ Reset Password with OTP
router.post("/reset-password", async (req, res) => {
  try {
    console.log("🔐 Password reset request received");
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: "Email, OTP, and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: "Password must be at least 6 characters long" 
      });
    }

    console.log(`🔍 Finding user: ${email}`);

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    console.log(`✅ User found, verifying OTP...`);

    // Verify OTP
    if (!user.otp || user.otp !== otp) {
      console.log(`❌ Invalid OTP for ${email}`);
      return res.status(400).json({ 
        success: false,
        error: "Invalid or expired OTP code" 
      });
    }

    if (user.otpExpires < Date.now()) {
      console.log(`❌ Expired OTP for ${email}`);
      return res.status(400).json({ 
        success: false,
        error: "OTP has expired. Please request a new one." 
      });
    }

    console.log(`✅ OTP verified, updating password...`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password and clear OTP
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    console.log(`✅ Password reset successful for: ${user.email}`);
    
    res.json({ 
      success: true,
      message: "Password reset successful! You can now login with your new password." 
    });

  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ 
      success: false,
      error: "Password reset failed. Please try again." 
    });
  }
});
// In routes/auth.js
router.post("/forgot-password", async (req, res) => {
  try {
    console.log("🔑 Forgot password request received");
    // ... rest of the code
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Password reset request failed. Please try again." 
    });
  }
});

// Add this route to your auth.js file (after the forgot-password route)
router.post("/reset-password", async (req, res) => {
  try {
    console.log("🔐 Password reset request received");
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: "Email, OTP, and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: "Password must be at least 6 characters long" 
      });
    }

    console.log(`🔍 Finding user: ${email}`);

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    console.log(`✅ User found, verifying OTP...`);

    // Verify OTP
    if (!user.otp || user.otp !== otp) {
      console.log(`❌ Invalid OTP for ${email}`);
      return res.status(400).json({ 
        success: false,
        error: "Invalid or expired OTP code" 
      });
    }

    if (user.otpExpires < Date.now()) {
      console.log(`❌ Expired OTP for ${email}`);
      return res.status(400).json({ 
        success: false,
        error: "OTP has expired. Please request a new one." 
      });
    }

    console.log(`✅ OTP verified, updating password...`);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password and clear OTP
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    console.log(`✅ Password reset successful for: ${user.email}`);
    
    res.json({ 
      success: true,
      message: "Password reset successful! You can now login with your new password." 
    });

  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ 
      success: false,
      error: "Password reset failed. Please try again." 
    });
  }
});

// ✅ ADMIN ROUTES FOR USER BLOCKING/UNBLOCKING

// Block a user (Admin only)
router.post("/admin/block-user", async (req, res) => {
  try {
    console.log("🔒 Admin block user request received");
    const { userId, reason, adminId } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        error: "User ID and block reason are required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    if (user.isBlocked) {
      return res.status(400).json({
        success: false,
        error: "User is already blocked"
      });
    }

    // Block the user
    user.isBlocked = true;
    user.blockReason = reason;
    user.blockedAt = new Date();
    user.blockedBy = adminId || "Admin";
    await user.save();

    console.log(`🚫 User blocked: ${user.email} by ${adminId || "Admin"}`);

    res.json({
      success: true,
      message: `User ${user.email} has been blocked successfully`,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        isBlocked: user.isBlocked,
        blockReason: user.blockReason,
        blockedAt: user.blockedAt
      }
    });

  } catch (err) {
    console.error("❌ Block user error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to block user"
    });
  }
});

// Unblock a user (Admin only)
router.post("/admin/unblock-user", async (req, res) => {
  try {
    console.log("🔓 Admin unblock user request received");
    const { userId, adminId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    if (!user.isBlocked) {
      return res.status(400).json({
        success: false,
        error: "User is not blocked"
      });
    }

    // Unblock the user
    user.isBlocked = false;
    user.blockReason = null;
    user.blockedAt = null;
    user.blockedBy = null;
    await user.save();

    console.log(`✅ User unblocked: ${user.email} by ${adminId || "Admin"}`);

    res.json({
      success: true,
      message: `User ${user.email} has been unblocked successfully`,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        isBlocked: user.isBlocked
      }
    });

  } catch (err) {
    console.error("❌ Unblock user error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to unblock user"
    });
  }
});

// Get all users with blocking status (Admin only)
router.get("/admin/users", async (req, res) => {
  try {
    console.log("👥 Admin get all users request");
    
    const users = await User.find({})
      .select('-password -otp') // Exclude sensitive fields
      .sort({ createdAt: -1 });

    const usersWithBlockStatus = users.map(user => ({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      babyName: user.babyName,
      babyAge: user.babyAge,
      babyGender: user.babyGender,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      blockReason: user.blockReason,
      blockedAt: user.blockedAt,
      blockedBy: user.blockedBy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.json({
      success: true,
      count: usersWithBlockStatus.length,
      users: usersWithBlockStatus
    });

  } catch (err) {
    console.error("❌ Get users error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users"
    });
  }
});

// Get user blocking status by ID (Admin only)
router.get("/admin/user/:userId", async (req, res) => {
  try {
    console.log(`👤 Admin get user details request: ${req.params.userId}`);
    
    const user = await User.findById(req.params.userId)
      .select('-password -otp'); // Exclude sensitive fields

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        babyName: user.babyName,
        babyAge: user.babyAge,
        babyGender: user.babyGender,
        isVerified: user.isVerified,
        isBlocked: user.isBlocked,
        blockReason: user.blockReason,
        blockedAt: user.blockedAt,
        blockedBy: user.blockedBy,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (err) {
    console.error("❌ Get user error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user details"
    });
  }
});


export default router;