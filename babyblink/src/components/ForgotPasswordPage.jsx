import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css"; // Reuse login page styles

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP & New Password
  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const displayMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleSendOTP = async (e) => {
  e.preventDefault();
  
  if (!form.email) {
    displayMessage("Please enter your email address", "error");
    return;
  }

  setLoading(true);
  setMessage("");

  try {
    console.log("Sending forgot password request to:", "/api/auth/forgot-password");
    console.log("Request body:", JSON.stringify({ email: form.email }));
    
   // In ForgotPasswordPage.jsx, update the fetch URL:
const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email: form.email }),
});

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);
    
    // Get the raw response text first
    const responseText = await response.text();
    console.log("Raw response:", responseText);

    // Try to parse as JSON
    let data;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
        console.log("Parsed JSON:", data);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        displayMessage("Server returned invalid response", "error");
        return;
      }
    } else {
      console.error("Empty response received");
      displayMessage("Server returned empty response", "error");
      return;
    }

    if (data.success) {
      displayMessage("Password reset code sent! Check your email.", "success");
      setStep(2);
    } else {
      displayMessage(data.error || "Failed to send reset code", "error");
    }
  } catch (error) {
    console.error("Network error:", error);
    displayMessage("Network error. Please try again.", "error");
  }
  
  setLoading(false);
 };

 
 const handleResetPassword = async (e) => {
  e.preventDefault();
  
  if (!form.otp || !form.newPassword || !form.confirmPassword) {
    displayMessage("Please fill in all fields", "error");
    return;
  }

  if (form.newPassword !== form.confirmPassword) {
    displayMessage("Passwords don't match", "error");
    return;
  }

  if (form.newPassword.length < 6) {
    displayMessage("Password must be at least 6 characters long", "error");
    return;
  }

  setLoading(true);
  setMessage("");

  try {
    console.log("Sending reset password request...");
    const response = await fetch("http://localhost:5000/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        email: form.email, 
        otp: form.otp, 
        newPassword: form.newPassword 
      }),
    });

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    let data;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
        console.log("Parsed response:", data);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        displayMessage("Server returned invalid response", "error");
        return;
      }
    } else {
      console.error("Empty response received");
      displayMessage("Server returned empty response", "error");
      return;
    }

    if (data.success) {
      displayMessage("Password reset successful! Redirecting to login...", "success");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      displayMessage(data.error || "Password reset failed", "error");
    }
  } catch (error) {
    console.error("Network error:", error);
    displayMessage("Network error. Please try again.", "error");
  }
  
  setLoading(false);
};

  return (
    <div className="login-container">
      <Link to="/login" className="home-link">← Back to Login</Link>
      
      <div className="login-form-container">
        {step === 1 ? (
          <form className="login-form" onSubmit={handleSendOTP}>
            <h2>Forgot Password? 🔐</h2>
            <p className="login-subtitle">Enter your email to reset your password</p>
            
            <div className="form-group">
              <input
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
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
        ) : (
          <form className="login-form" onSubmit={handleResetPassword}>
            <h2>Reset Password 🔐</h2>
            <p className="login-subtitle">Enter the code sent to {form.email}</p>
            
            <div className="form-group">
              <input
                name="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={form.otp}
                onChange={handleChange}
                required
                maxLength="6"
                pattern="[0-9]{6}"
              />
            </div>

            <div className="form-group">
              <input
                name="newPassword"
                type="password"
                placeholder="New Password (min 6 characters)"
                value={form.newPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm New Password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={loading ? "loading" : ""}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            
            <div style={{marginTop: "15px", textAlign: "center"}}>
              <button 
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: "none", 
                  border: "none", 
                  color: "#666", 
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                ← Use different email
              </button>
            </div>
          </form>
        )}

        {message && (
          <div className={`message ${messageType}`}>
            <p>{message}</p>
          </div>
        )}

        <div className="register-link">
          <p>Remember your password? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
}