import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // used for login
  fullName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: String,
  babyName: String,
  babyAge: Number,
  babyGender: { type: String, enum: ["Male", "Female", "Other"] },
  address: String,
  isVerified: { type: Boolean, default: false }, // after OTP
  otp: String,
  otpExpires: Date,
  
  // Admin blocking functionality
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    trim: true
  },
  blockedAt: {
    type: Date
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to admin user who blocked
  },
  loginCount: {
    type: Number,
    default: 0
  },
  profileCompleteness: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);