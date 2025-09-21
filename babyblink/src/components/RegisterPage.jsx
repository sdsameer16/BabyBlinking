import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, verifyOTP, login, resendOTP } = useAuth();
  
  const [form, setForm] = useState({
    username: "", 
    fullName: "", 
    email: "", 
    password: "",
    phoneNumber: "", 
    babyName: "", 
    babyAge: "", 
    babyGender: "", 
    address: ""
  });

  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [tempCreds, setTempCreds] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", "info"
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const displayMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    // Clear message after 5 seconds
    setTimeout(() => setMessage(""), 5000);
  };

  const validateForm = () => {
    if (!form.username || !form.email || !form.password) {
      displayMessage("Username, email, and password are required", "error");
      return false;
    }

    if (form.password.length < 6) {
      displayMessage("Password must be at least 6 characters long", "error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      displayMessage("Please enter a valid email address", "error");
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setMessage("");

    const result = await register(form);

    if (result.success) {
      displayMessage("Registration successful! Please check your email for the verification code.", "success");
      setShowOtp(true);
      setTempCreds({ username: form.username, password: form.password });
    } else {
      displayMessage(result.error || "Registration failed", "error");
    }
    
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      displayMessage("Please enter a valid 6-digit OTP", "error");
      return;
    }

    setLoading(true);
    setMessage("");

    const verifyResult = await verifyOTP(form.email, otp);

    if (verifyResult.success) {
      displayMessage("Email verified successfully! Logging you in...", "success");
      
      // Auto-login after successful verification
      setTimeout(async () => {
        const loginResult = await login({ 
          username: tempCreds.username, 
          password: tempCreds.password 
        });

        if (loginResult.success) {
          displayMessage("Welcome to Baby Blink! 🍼", "success");
          setTimeout(() => navigate("/home"), 1000);
        } else {
          displayMessage("Verification successful! Please login manually.", "info");
          setTimeout(() => navigate("/login"), 2000);
        }
      }, 1000);
    } else {
      displayMessage(verifyResult.error || "OTP verification failed", "error");
    }
    
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    const result = await resendOTP(form.email);
    
    if (result.success) {
      displayMessage("New verification code sent to your email!", "success");
      setOtp(""); // Clear current OTP input
      
      // Start cooldown timer
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      displayMessage(result.error || "Failed to resend verification code", "error");
    }
    
    setLoading(false);
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  return (
    <div className="register-container">
      <Link to="/" className="home-link">← Back to Home</Link>
      
      {!showOtp ? (
        <form className="register-form" onSubmit={handleRegister}>
          <h2>Create Your Baby Blink Account 👶</h2>
          
          <div className="form-group">
            <input 
              name="fullName" 
              placeholder="Full Name *" 
              value={form.fullName} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <input 
              name="username" 
              placeholder="Username *" 
              value={form.username} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <input 
              name="email" 
              type="email" 
              placeholder="Email Address *" 
              value={form.email} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <input 
              name="password" 
              type="password" 
              placeholder="Password (min 6 characters) *" 
              value={form.password} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <input 
              name="phoneNumber" 
              placeholder="Phone Number" 
              value={form.phoneNumber} 
              onChange={handleChange} 
            />
          </div>

          <h3>Baby Information</h3>

          <div className="form-group">
            <input 
              name="babyName" 
              placeholder="Baby's Name" 
              value={form.babyName} 
              onChange={handleChange} 
            />
          </div>

          <div className="form-group">
            <input 
              name="babyAge" 
              type="number" 
              placeholder="Baby's Age (months)" 
              value={form.babyAge} 
              onChange={handleChange} 
              min="0"
              max="60"
            />
          </div>

          <div className="form-group">
            <select name="babyGender" value={form.babyGender} onChange={handleChange}>
              <option value="">Select Baby's Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <textarea 
              name="address" 
              placeholder="Address" 
              value={form.address} 
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={loading ? "loading" : ""}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      ) : (
        <div className="otp-panel">
          <h2>📧 Verify Your Email</h2>
          <p>We've sent a 6-digit verification code to:</p>
          <p className="email-highlight">{form.email}</p>
          
          <div className="otp-input-container">
            <input 
              type="text"
              value={otp} 
              onChange={handleOtpChange}
              placeholder="Enter 6-digit code"
              maxLength="6"
              className="otp-input"
              autoFocus
            />
          </div>

          <div className="otp-buttons">
            <button 
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className={`verify-btn ${loading ? "loading" : ""}`}
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <button 
              onClick={handleResendOtp}
              disabled={loading || resendCooldown > 0}
              className="resend-btn"
            >
              {resendCooldown > 0 
                ? `Resend in ${resendCooldown}s` 
                : loading 
                  ? "Sending..." 
                  : "Resend Code"
              }
            </button>
          </div>

          <p className="otp-help">
            Didn't receive the code? Check your spam folder or click resend.
          </p>
        </div>
      )}

      {message && (
        <div className={`message ${messageType}`}>
          <p>{message}</p>
        </div>
      )}

      <div className="login-link">
        <p>Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
}