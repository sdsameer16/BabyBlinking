import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const displayMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!email) {
      displayMessage("Please enter your email address", "error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        displayMessage("OTP sent to your email! Check your inbox.", "success");
        setStep(2);
      } else {
        displayMessage(data.error || "Failed to send OTP", "error");
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      displayMessage("Network error. Please check your connection.", "error");
    }
    
    setLoading(false);
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      displayMessage("Please enter a valid 6-digit OTP", "error");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      displayMessage("Password must be at least 6 characters long", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      displayMessage("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        displayMessage("Password reset successful! Redirecting to login...", "success");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        displayMessage(data.error || "Failed to reset password", "error");
      }
    } catch (error) {
      console.error('Reset password error:', error);
      displayMessage("Network error. Please try again.", "error");
    }
    
    setLoading(false);
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        displayMessage("New OTP sent to your email!", "success");
      } else {
        displayMessage(data.error || "Failed to resend OTP", "error");
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      displayMessage("Network error. Please try again.", "error");
    }
    
    setLoading(false);
  };

  return (
    <div className="forgot-password-container">
      <Link to="/login" className="back-link">← Back to Login</Link>
      
      <div className="forgot-password-form-container">
        
        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form className="forgot-password-form" onSubmit={handleSendOTP}>
            <h2>🔐 Forgot Password</h2>
            <p className="form-subtitle">Enter your email to receive a reset code</p>
            
            <div className="form-group">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={loading ? "loading" : ""}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP and New Password */}
        {step === 2 && (
          <form className="forgot-password-form" onSubmit={handleResetPassword}>
            <h2>🔑 Reset Your Password</h2>
            <p className="form-subtitle">Enter the 6-digit code sent to {email}</p>
            
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength="6"
                className="otp-input"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="6"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
                autoComplete="new-password"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={loading ? "loading" : ""}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <div className="resend-section">
              <p>Didn't receive the code?</p>
              <button 
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="resend-btn"
              >
                {loading ? "Sending..." : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        {/* Progress indicator */}
        <div className="progress-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>

        {/* Message display */}
        {message && (
          <div className={`message ${messageType}`}>
            <p>{message}</p>
          </div>
        )}

        <div className="login-link">
          <p>Remember your password? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
}