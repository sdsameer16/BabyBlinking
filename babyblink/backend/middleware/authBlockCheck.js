import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Middleware to check if user is blocked on every protected request
export const checkUserBlockStatus = async (req, res, next) => {
  try {
    // Only run on authenticated requests
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Skip if no token
    }

    const token = authHeader.substring(7);
    
    try {
      // Verify and decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check current user status in database
      const user = await User.findById(decoded.id).select('isBlocked blockReason blockedAt blockedBy email username');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User account not found',
          forceLogout: true
        });
      }

      // 🚫 CHECK IF USER IS BLOCKED
      if (user.isBlocked) {
        console.log(`🚫 BLOCKED USER DETECTED: ${user.email} (${user.username}) - Reason: ${user.blockReason}`);
        console.log(`🚫 Block date: ${user.blockedAt}`);
        console.log(`🚫 Blocked by admin ID: ${user.blockedBy}`);
        
        return res.status(403).json({
          success: false,
          error: 'You were blocked by admin. For further information please contact "kinderkare@support.ac.in"',
          blocked: true,
          reason: user.blockReason || 'Account suspended by administrator',
          blockedAt: user.blockedAt,
          blockedBy: user.blockedBy,
          supportEmail: 'kinderkare@support.ac.in',
          supportMessage: 'For assistance with your blocked account, please email our support team.',
          forceLogout: true,
          contactSupport: true
        });
      }

      // User is not blocked, continue
      req.user = user;
      next();
      
    } catch (jwtError) {
      // Invalid token, skip block check
      return next();
    }
    
  } catch (error) {
    console.error('❌ Block status check error:', error);
    next(); // Continue on error to avoid breaking the app
  }
};

// Enhanced auth middleware that includes block checking
export const authenticateAndCheckBlock = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No authentication token provided',
        requiresAuth: true 
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          error: 'Session expired', 
          expired: true,
          requiresAuth: true 
        });
      }
      return res.status(401).json({ 
        success: false,
        error: 'Invalid authentication token',
        requiresAuth: true 
      });
    }

    // Get user and check if blocked
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account not found',
        requiresAuth: true
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email first',
        needsVerification: true,
        email: user.email
      });
    }

    // 🚫 CHECK IF USER IS BLOCKED
    if (user.isBlocked) {
      console.log(`🚫 BLOCKED USER ACCESS ATTEMPT: ${user.email} - Reason: ${user.blockReason}`);
      return res.status(403).json({
        success: false,
        error: 'You were blocked by admin. For further information please contact "kinderkare@support.ac.in"',
        blocked: true,
        reason: user.blockReason || 'Account suspended by administrator',
        blockedAt: user.blockedAt,
        blockedBy: user.blockedBy,
        supportEmail: 'kinderkare@support.ac.in',
        supportMessage: 'For assistance with your blocked account, please email our support team.',
        forceLogout: true,
        contactSupport: true
      });
    }

    // User is authenticated and not blocked
    req.user = user;
    next();

  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
};