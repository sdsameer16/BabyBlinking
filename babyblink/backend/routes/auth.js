//auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const router = express.Router();

// Create transporter with more robust configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: false, // Set to true if you need detailed logs
    logger: false
  });
};

// Helper: generate OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
}

// Helper: validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper: Send email with retry logic
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Email attempt ${attempt}/${maxRetries} to: ${mailOptions.to}`);
      
      // Create fresh transporter for each attempt
      const transporter = createTransporter();
      
      // Verify transporter before sending
      await transporter.verify();
      console.log(`✅ Transporter verified for attempt ${attempt}`);
      
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully on attempt ${attempt}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      
      return info;
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  throw lastError;
};

// ✅ Test email route (for debugging)
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
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: "🧪 Test Email - Baby Blink",
      html: `
        <h2>Test Email Success!</h2>
        <p>If you receive this email, your email configuration is working correctly! ✅</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>From: KinderKares Baby Blink System</p>
      `,
      text: `Test email sent successfully at ${new Date().toISOString()}`
    };

    const info = await sendEmailWithRetry(testEmail);
    
    res.json({ 
      success: true,
      message: "Test email sent successfully!", 
      messageId: info.messageId,
      recipient: process.env.EMAIL_USER
    });
  } catch (error) {
    console.error("❌ Test email failed:", error);
    res.status(500).json({ 
      success: false,
      error: "Test email failed", 
      details: error.message,
      code: error.code 
    });
  }
});

// ✅ Register route with enhanced error handling
router.post("/register", async (req, res) => {
  try {
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
      return res.status(400).json({ 
        error: "Username, email and password are required" 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email" });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }

    // // Check if user already exists
    // const existingUser = await User.findOne({ 
    //   $or: [{ username }, { email }] 
    // });

const existingUser = await User.findOne({ 
  $or: [{ username }, { email }] 
});

if (existingUser) {
  if (existingUser.email === email) {
    return res.status(400).json({ error: "Email already registered" });
  }
  if (existingUser.username === username) {
    return res.status(400).json({ error: "Username already taken" });
  }
}
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate OTP
    const otp = generateOtp();
    console.log(`🔢 Generated OTP for ${email}: ${otp}`);

    // Create new user
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
      otpExpires: Date.now() + 15 * 60 * 1000, // valid for 15 mins
      isVerified: false
    });

    await user.save();
    console.log(`✅ User saved to database: ${email}`);

    // Send OTP email
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
            <p style="margin: 0; font-size: 16px;">Hi ${fullName || username}!</p>
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
      text: `
Welcome to Baby Blink!

Hi ${fullName || username},

Thank you for registering with Baby Blink. To complete your registration, please verify your email address using this verification code:

VERIFICATION CODE: ${otp}

This code will expire in 15 minutes.

If you didn't create this account, please ignore this email.

---
KinderKares Baby Blink System
      `
    };

    try {
      const info = await sendEmailWithRetry(mailOptions);
      console.log(`✅ Registration email sent successfully to ${email}`);
      
      res.status(201).json({ 
        message: "Registration successful! Please check your email for the verification code.",
        email: email,
        messageId: info.messageId
      });

    } catch (emailError) {
      console.error(`❌ Failed to send registration email to ${email}:`, emailError);
      
      // Delete the user if email sending fails
      await User.findByIdAndDelete(user._id);
      console.log(`🗑️ Deleted user due to email failure: ${email}`);
      
      // Return user-friendly error message
      return res.status(500).json({ 
        error: "Unable to send verification email. Please try again or contact support if the problem persists."
      });
    }

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ✅ Verify OTP route
router.post("/verify-otp", async (req, res) => {
  try {
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
    console.error("Verify OTP error:", err);
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
    console.error("Resend OTP error:", err);
    res.status(500).json({ error: "Failed to resend verification code" });
  }
});

// ✅ Enhanced Login route - Strict Database Verification
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔍 Login attempt for: ${username}`);

    // Validation
    if (!username || !password) {
      console.log("❌ Missing username or password");
      return res.status(400).json({ error: "Username/Email and password are required" });
    }

    // Step 1: Check if user exists in database
    console.log("🔍 Searching for user in database...");
    const user = await User.findOne({ 
      $or: [
        { username: username },
        { email: username }
      ]
    });

    console.log("🔍 Database search result:", user ? "User found" : "User not found");

    if (!user) {
      console.log(`❌ No user found with username/email: ${username}`);
      return res.status(401).json({ error: "Invalid username/email or password" });
    }

    console.log(`✅ User found: ${user.username} (${user.email})`);

    // Step 2: Check if email is verified
    if (!user.isVerified) {
      console.log(`⚠️ User ${user.email} is not verified`);
      return res.status(403).json({ 
        error: "Please verify your email first. Check your inbox for the verification code.",
        needsVerification: true,
        email: user.email
      });
    }

    console.log(`✅ User is verified: ${user.email}`);

    // Step 3: Verify password against database
    console.log("🔍 Verifying password...");
    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log("🔍 Password verification result:", isMatch ? "Match" : "No match");

    if (!isMatch) {
      console.log(`❌ Password does not match for user: ${user.username}`);
      return res.status(401).json({ error: "Invalid username/email or password" });
    }

    console.log(`✅ Password verified for user: ${user.username}`);

    // Step 4: Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        username: user.username,
        email: user.email 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "365d" }  // 7 days as discussed
    );

    console.log(`✅ Login successful for: ${user.username} (${user.email})`);

    // Step 5: Return success response
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

// Debug route to check if users exist in database
router.get("/check-user/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;
    
    const user = await User.findOne({ 
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    }, {
      password: 0, // Don't return password
      otp: 0       // Don't return OTP
    });

    if (!user) {
      return res.json({
        exists: false,
        message: "User not found in database"
      });
    }

    res.json({
      exists: true,
      user: {
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Forgot Password - Send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "No account found with this email address" });
    }

    // Generate OTP for password reset
    const otp = generateOtp();
    
    // Set OTP and expiration (15 minutes)
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    console.log(`🔑 Password reset OTP generated for ${email}: ${otp}`);

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
      text: `
Password Reset Request

Hi ${user.fullName || user.username},

You requested to reset your password for your Baby Blink account.

Your password reset code is: ${otp}

This code will expire in 15 minutes.

If you didn't request this password reset, please ignore this email.

---
KinderKares Baby Blink System
      `
    };

    try {
      await sendEmailWithRetry(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      
      res.json({ 
        message: "Password reset code sent to your email. Please check your inbox.",
        email: email
      });
    } catch (emailError) {
      console.error(`❌ Failed to send password reset email to ${email}:`, emailError);
      res.status(500).json({ 
        error: "Unable to send password reset email. Please try again." 
      });
    }

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Password reset request failed. Please try again." });
  }
});

// ✅ Reset Password with OTP
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify OTP
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ error: "Invalid or expired OTP code" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password and clear OTP
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    console.log(`✅ Password reset successful for: ${user.email}`);
    
    res.json({ message: "Password reset successful! You can now login with your new password." });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
});

export default router;