import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, resendOTP } = useAuth(); // Use the AuthContext functions
  
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const displayMessage = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!form.username || !form.password) {
      displayMessage("Please enter both username and password", "error");
      return;
    }

    setLoading(true);
    setMessage("");
    setNeedsVerification(false);

    // Use the login function from AuthContext
    const result = await login({
      username: form.username,
      password: form.password
    });

    if (result.success) {
      displayMessage("Login successful! Welcome back!", "success");
      setTimeout(() => navigate("/home"), 1000);
    } else {
      // Handle different error cases based on your backend response
      if (result.data && result.data.needsVerification) {
        setNeedsVerification(true);
        setUserEmail(result.data.email);
        displayMessage("Please verify your email first. Check your inbox for the verification code.", "info");
      } else if (result.error && result.error.includes("verify your email")) {
        // Alternative way to detect verification needed
        setNeedsVerification(true);
        // Try to extract email from error or ask user to enter it
        displayMessage("Please verify your email first. Check your inbox for the verification code.", "info");
      } else {
        displayMessage(result.error || "Login failed", "error");
      }
    }
    
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      // If we don't have the email, ask user to enter it
      const email = prompt("Please enter your email address:");
      if (!email) return;
      setUserEmail(email);
    }

    setLoading(true);
    
    const result = await resendOTP(userEmail);
    
    if (result.success) {
      displayMessage("Verification code sent! Check your email.", "success");
    } else {
      displayMessage(result.error || "Failed to send verification code", "error");
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <Link to="/" className="home-link">← Back to Home</Link>
      
      <div className="login-form-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Welcome Back!</h2>
          <p className="login-subtitle">Sign in to your Baby Blink account</p>
          
          <div className="form-group">
            <input
              name="username"
              type="text"
              placeholder="Username or Email"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={loading ? "loading" : ""}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {needsVerification && (
          <div className="verification-notice">
            <h3>Email Verification Required</h3>
            <p>Your account needs email verification to continue.</p>
            {userEmail && <p className="email-display">Email: {userEmail}</p>}
            
            <div className="verification-actions">
              <Link to="/register" className="verify-link">
                Go to Registration Page
              </Link>
              <button 
                onClick={handleResendVerification}
                disabled={loading}
                className="resend-verification-btn"
              >
                {loading ? "Sending..." : "Send New Code"}
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`message ${messageType}`}>
            <p>{message}</p>
          </div>
        )}

        <div className="register-link">
          <p>Don't have an account? <Link to="/register">Create one here</Link></p>
        </div>

        <div className="forgot-password">
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>
      </div>
    </div>
  );
}