import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import User from '../models/User.js';

// Generate device info from user agent
const parseDeviceInfo = (userAgent, ip) => {
  const deviceInfo = {
    userAgent,
    ip,
    browser: 'Unknown',
    os: 'Unknown',
    device: 'Unknown'
  };

  if (userAgent) {
    // Browser detection
    if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
    else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
    else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';

    // OS detection
    if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
    else if (userAgent.includes('Mac OS')) deviceInfo.os = 'macOS';
    else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
    else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
    else if (userAgent.includes('iOS')) deviceInfo.os = 'iOS';

    // Device detection
    if (userAgent.includes('Mobile')) deviceInfo.device = 'Mobile';
    else if (userAgent.includes('Tablet')) deviceInfo.device = 'Tablet';
    else deviceInfo.device = 'Desktop';
  }

  return deviceInfo;
};

// Create session
export const createSession = async (user, req) => {
  try {
    const deviceInfo = parseDeviceInfo(
      req.get('User-Agent'), 
      req.ip || req.connection.remoteAddress
    );

    // Generate tokens
    const sessionToken = jwt.sign(
      { 
        userId: user._id,
        sessionId: new Date().getTime() // Unique session identifier
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // 7 days
    );

    const refreshToken = jwt.sign(
      { 
        userId: user._id,
        type: 'refresh',
        timestamp: Date.now()
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' } // 30 days
    );

    // Create session in database
    const session = new Session({
      userId: user._id,
      sessionToken,
      refreshToken,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      lastActivity: new Date()
    });

    await session.save();

    return {
      sessionToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      session: session
    };

  } catch (error) {
    console.error('Create session error:', error);
    throw new Error('Failed to create session');
  }
};

// Verify session middleware
export const verifySession = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!sessionToken) {
      return res.status(401).json({ 
        error: 'No session token provided',
        requiresAuth: true 
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Session expired', 
          expired: true,
          requiresAuth: true 
        });
      }
      return res.status(401).json({ 
        error: 'Invalid session token',
        requiresAuth: true 
      });
    }

    // Find session in database
    const session = await Session.findOne({
      sessionToken,
      userId: decoded.userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('userId', 'username email fullName babyName babyAge babyGender isVerified isBlocked blockReason blockedAt blockedBy');

    if (!session) {
      return res.status(401).json({ 
        error: 'Session not found or expired',
        requiresAuth: true 
      });
    }

    // Check if user still exists and is verified
    if (!session.userId || !session.userId.isVerified) {
      await Session.findByIdAndUpdate(session._id, { isActive: false });
      return res.status(401).json({ 
        error: 'User account not found or not verified',
        requiresAuth: true 
      });
    }

    // 🚫 CHECK IF USER IS BLOCKED BY ADMIN
    if (session.userId.isBlocked) {
      console.log(`🚫 Blocked user attempted to access protected route: ${session.userId.email} - Reason: ${session.userId.blockReason}`);
      // Invalidate all active sessions for blocked user
      await Session.updateMany(
        { userId: session.userId._id, isActive: true },
        { isActive: false }
      );
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended. Please contact support for assistance.',
        blocked: true,
        reason: session.userId.blockReason || 'Account suspended by administrator',
        blockedAt: session.userId.blockedAt,
        requiresAuth: true
      });
    }

    // Update last activity
    await session.updateActivity();

    // Add user and session to request object
    req.user = session.userId;
    req.session = session;
    req.sessionToken = sessionToken;

    next();

  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ 
      error: 'Session verification failed' 
    });
  }
};

// Refresh session token
export const refreshSession = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ 
        error: 'Invalid or expired refresh token',
        requiresAuth: true 
      });
    }

    // Find session with refresh token
    const session = await Session.findOne({
      refreshToken,
      userId: decoded.userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!session || !session.userId) {
      return res.status(401).json({ 
        error: 'Session not found',
        requiresAuth: true 
      });
    }

    // Generate new tokens
    const newSessionToken = jwt.sign(
      { 
        userId: session.userId._id,
        sessionId: new Date().getTime()
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const newRefreshToken = jwt.sign(
      { 
        userId: session.userId._id,
        type: 'refresh',
        timestamp: Date.now()
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Update session
    session.sessionToken = newSessionToken;
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    session.lastActivity = new Date();
    await session.save();

    res.json({
      message: 'Session refreshed successfully',
      sessionToken: newSessionToken,
      refreshToken: newRefreshToken,
      expiresIn: 7 * 24 * 60 * 60,
      user: {
        id: session.userId._id,
        username: session.userId.username,
        email: session.userId.email,
        fullName: session.userId.fullName,
        babyName: session.userId.babyName,
        babyAge: session.userId.babyAge,
        babyGender: session.userId.babyGender
      }
    });

  } catch (error) {
    console.error('Refresh session error:', error);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
};

// Logout (invalidate session)
export const logoutSession = async (req, res) => {
  try {
    const { sessionToken } = req;

    if (sessionToken) {
      await Session.findOneAndUpdate(
        { sessionToken },
        { isActive: false }
      );
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Logout from all devices
export const logoutAllSessions = async (req, res) => {
  try {
    const { user } = req;

    await Session.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    res.json({ message: 'Logged out from all devices successfully' });

  } catch (error) {
    console.error('Logout all sessions error:', error);
    res.status(500).json({ error: 'Failed to logout from all devices' });
  }
};

// Get user's active sessions
export const getUserSessions = async (req, res) => {
  try {
    const { user } = req;

    const sessions = await Session.getUserActiveSessions(user._id);

    const sessionList = sessions.map(session => ({
      id: session._id,
      deviceInfo: session.deviceInfo,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      isCurrent: session.sessionToken === req.sessionToken
    }));

    res.json({
      sessions: sessionList,
      total: sessionList.length
    });

  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};