import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sessionToken: { 
    type: String, 
    required: true, 
    unique: true 
  },
  refreshToken: { 
    type: String, 
    required: true 
  },
  deviceInfo: {
    userAgent: String,
    ip: String,
    browser: String,
    os: String,
    device: String
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for auto-cleanup
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ sessionToken: 1 });
sessionSchema.index({ refreshToken: 1 });

// Instance methods
sessionSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

sessionSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Static methods
sessionSchema.statics.cleanExpiredSessions = async function() {
  return this.deleteMany({ 
    expiresAt: { $lt: new Date() } 
  });
};

sessionSchema.statics.getUserActiveSessions = async function(userId) {
  return this.find({ 
    userId, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('userId', 'username email fullName');
};

export default mongoose.model("Session", sessionSchema);