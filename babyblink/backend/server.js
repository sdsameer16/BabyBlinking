import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

// IMPORTANT: Load environment variables FIRST before anything else
dotenv.config();

// Debug: Check if environment variables are loaded
console.log("🔍 Environment Variables Check:");
console.log("PORT:", process.env.PORT || "Not set");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Set" : "❌ Not set");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Set" : "❌ Not set");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? `✅ Set (${process.env.EMAIL_USER})` : "❌ Not set");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ Set (hidden)" : "❌ Not set");
console.log("Current working directory:", process.cwd());
console.log("Looking for .env file at:", `${process.cwd()}/.env`);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'KinderKares Baby Blink Server is running!', 
    timestamp: new Date().toISOString(),
    env: {
      emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      dbConfigured: !!process.env.MONGO_URI,
      jwtConfigured: !!process.env.JWT_SECRET
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    // Check critical environment variables before starting
    const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      console.error('\n🔧 Please check your .env file and make sure all required variables are set.');
      process.exit(1);
    }
    
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📧 Email configuration: ${process.env.EMAIL_USER ? '✅ Ready' : '❌ Not configured'}`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();