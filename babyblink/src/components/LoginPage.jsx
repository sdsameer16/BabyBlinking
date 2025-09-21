import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  // Accept either email OR username
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    
    // Build payload depending on whether user entered an email or a username
    const trimmed = identifier.trim();
    const payload = trimmed.includes("@")
      ? { email: trimmed.toLowerCase(), password }
      : { username: trimmed, password };

    const result = await login(payload);
    
    if (result.success) {
      navigate("/home");
    } else {
      // Show clearer guidance for common cases
      if (result.error?.toLowerCase().includes("not verified") || result.error?.toLowerCase().includes("verify")) {
        setMsg("Please verify your email/OTP before logging in.");
      } else {
        setMsg(result.error || "Login failed. Please check your credentials and try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <Link to="/" className="home-link">Home</Link>
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Email or Username"
          autoComplete="username"
          required
        />
        <input value={password} type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
      <p className="message">{msg}</p>
      <p>New here? <Link to="/register">Register</Link></p>
    </div>
  );
}
