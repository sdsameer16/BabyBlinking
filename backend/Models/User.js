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
  otpExpires: Date
}, { timestamps: true });

export default mongoose.model("User", userSchema);
