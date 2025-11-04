import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import parentsRouter from './routes/parents.js';
import emergencyRoutes from './routes/emergency.js';

// Load environment variables FIRST
dotenv.config();

console.log("Starting server with environment check...");
console.log("NODE_ENV:", process.env.NODE_ENV || "development");
console.log("PORT:", process.env.PORT || 5000);
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "Set" : "Missing");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Set" : "Missing");
console.log("MONGO_URI:", process.env.MONGO_URI ? "Set" : "Missing");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Missing");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware with error handling
// Allow frontend origin (use FRONTEND_URL env var or default to Vite dev server)
const frontendOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'https://babyblinking.onrender.com';
app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));

app.use(express.json({ 
  limit: '10mb',
  strict: false
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
    }
  });
  next();
});

// Health check route (before auth routes)
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'KinderKares Baby Blink Server is running!', 
    timestamp: new Date().toISOString(),
    env: {
      emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      dbConfigured: !!process.env.MONGO_URI,
      jwtConfigured: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
// Parents routes (parent emergency info)
app.use('/api/parents', parentsRouter);
// Emergency routes (separate collections)
app.use('/api/emergency', emergencyRoutes);

// Catch-all for undefined routes
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/verify-otp',
      'POST /api/auth/resend-otp',
      'POST /api/auth/login',
      'POST /api/auth/test-email',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'POST /api/parents/parent-info/:parentId',
      'GET  /api/parents/parent-info/:parentId',
      'GET /api/user/profile',
      'PUT /api/user/profile',
      'GET /api/user/dashboard'
    ]
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

// Database connection with detailed error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully');
    console.log('Database:', mongoose.connection.name);
    
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    console.error('Check your MONGO_URI in .env file');
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
const startServer = async () => {
  try {
    // Check required environment variables
    const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing required environment variables:');
      missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      console.error('\nPlease check your .env file and make sure all required variables are set.');
      console.error('.env file should be in the same directory as server.js');
      process.exit(1);
    }
    
    // Connect to database
    await connectDB();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('\n🚀 =================================');
      console.log(`🌟 Server running on port ${PORT}`);
  console.log(`🌐 Health check: https://babyblinking.onrender.com/api/health`);
  console.log(`📧 Email test: https://babyblinking.onrender.com/api/auth/test-email`);
  console.log(`📝 Register: https://babyblinking.onrender.com/api/auth/register`);
  console.log(`🔐 Login: https://babyblinking.onrender.com/api/auth/login`);
      console.log('🚀 =================================\n');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        console.error('Try a different port or stop the other server');
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();