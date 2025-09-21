import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5174",
  credentials: true
}));
app.use(express.json());

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});
mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected');
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);

// Simple health check endpoint to verify server and DB status
app.get('/health', (req, res) => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  res.json({
    server: 'ok',
    dbState: states[mongoose.connection.readyState] || mongoose.connection.readyState,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));