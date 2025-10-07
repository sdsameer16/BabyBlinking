import express from 'express';
import { authenticateAndCheckBlock } from '../middleware/authBlockCheck.js';
import User from '../models/User.js';

const router = express.Router();

// Get user profile (protected route)
router.get('/profile', authenticateAndCheckBlock, async (req, res) => {
  try {
    const user = req.user;
    
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
        address: user.address,
        isVerified: user.isVerified,
        profileCompleteness: user.profileCompleteness,
        loginCount: user.loginCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update user profile (protected route)
router.put('/profile', authenticateAndCheckBlock, async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this route
    delete updates.password;
    delete updates.isVerified;
    delete updates.isBlocked;
    delete updates.blockReason;
    delete updates.blockedAt;
    delete updates.blockedBy;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Get dashboard data (protected route) - This will test blocking on every request
router.get('/dashboard', authenticateAndCheckBlock, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        message: `Welcome back, ${user.fullName || user.username}!`,
        babyInfo: {
          name: user.babyName,
          age: user.babyAge,
          gender: user.babyGender
        },
        userStats: {
          profileCompleteness: user.profileCompleteness,
          loginCount: user.loginCount,
          memberSince: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard'
    });
  }
});

export default router;