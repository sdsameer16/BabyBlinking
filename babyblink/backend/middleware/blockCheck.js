import User from '../models/User.js';

export const checkIfUserBlocked = async (req, res, next) => {
  try {
    // Only check if user is authenticated
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id).select('isBlocked blockReason blockedAt');
      
      if (user && user.isBlocked) {
        console.log(`🚫 Blocked user detected: ${req.user.email || req.user.id}`);
        return res.status(403).json({
          success: false,
          error: 'Your account has been suspended.',
          blocked: true,
          reason: user.blockReason || 'Account suspended',
          blockedAt: user.blockedAt,
          forceLogout: true
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Block check error:', error);
    next(); // Continue on error to avoid breaking the app
  }
};