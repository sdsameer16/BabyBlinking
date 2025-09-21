import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, verifyOTP, login } = useAuth();
  const [form, setForm] = useState({
    username: "", fullName: "", email: "", password: "",
    phoneNumber: "", babyName: "", babyAge: "", babyGender: "", address: ""
  });
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [tempCreds, setTempCreds] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    const result = await register(form);
    
    if (result.success) {
      setMessage(result.data.message);
      setShowOtp(true);
      setTempCreds({ username: form.username, password: form.password });
    } else {
      setMessage(result.error || "Registration failed");
    }
  };

  const handleVerifyOtp = async () => {
    setMessage("");
    const verifyResult = await verifyOTP(form.email, otp);
    
    if (verifyResult.success) {
      // After successful verification, automatically log in
      const loginResult = await login({ username: tempCreds.username, password: tempCreds.password });
      
      if (loginResult.success) {
        navigate("/home");
      } else {
        setMessage(loginResult.error || "Auto-login failed. Please login manually.");
      }
    } else {
      setMessage(verifyResult.error || "OTP verification failed");
    }
  };

  return (
    <div className="register-container">
      <Link to="/" className="home-link">Home</Link>
      <form className="register-form" onSubmit={handleRegister}>
        <h2>Create account</h2>
        <input name="fullName" placeholder="Full name" value={form.fullName} onChange={handleChange} required />
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <input name="phoneNumber" placeholder="Phone number" value={form.phoneNumber} onChange={handleChange} />
        <input name="babyName" placeholder="Baby's name" value={form.babyName} onChange={handleChange} />
        <input name="babyAge" type="number" placeholder="Baby's age" value={form.babyAge} onChange={handleChange} />
        <select name="babyGender" value={form.babyGender} onChange={handleChange}>
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <textarea name="address" placeholder="Address" value={form.address} onChange={handleChange}></textarea>

        {!showOtp && <button type="submit">Register</button>}
      </form>

      {showOtp && (
        <div className="otp-panel">
          <h3>Enter OTP sent to {form.email}</h3>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" />
          <button onClick={handleVerifyOtp}>Verify OTP & Login</button>
        </div>
      )}

      <p className="message">{message}</p>
      <p>Already registered? <Link to="/login">Login</Link></p>
    </div>
  );
}
