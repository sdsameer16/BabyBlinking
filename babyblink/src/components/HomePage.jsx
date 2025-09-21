import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./HomePage.css";


const HomePage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [sideTabs, setSideTabs] = useState([]);

  const handleLogout = async () => {
    await logout();
  };

  // Handle main tab clicks
  const handleTabClick = (tab) => {
    if (tab === "home") {
      setActiveTab("home");
      setSideTabs([]); // clear everything
    } else if (tab === "live") {
      setActiveTab("live"); // show iframe
    } else {
      // open side tab (don't remove live)
      if (!sideTabs.includes(tab)) {
        setSideTabs([...sideTabs, tab]);
      }
    }
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <h2 className="logo">Baby Blink</h2>
        <ul className="nav-links">
          <li onClick={() => handleTabClick("home")}>Home</li>
          <li onClick={() => handleTabClick("live")}>Live</li>
          <li onClick={() => handleTabClick("savefeed")}>Save Feed</li>
          <li onClick={() => handleTabClick("emergency")}>Emergency Information</li>
          <li onClick={() => handleTabClick("chat")}>Live Chat</li>
        </ul>
        <div className="user-section">
          <span>Welcome, {user?.fullName || user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      {/* Content Section */}
      <div className="content">
        {/* Home Page */}
        {activeTab === "home" && (
          <div className="welcome-card">
            <h1>Welcome 👶</h1>
            <p>
              We’re here to help you monitor and care for your baby with love,
              safety, and real-time support.
            </p>
          </div>
        )}

        {/* Live Section with side panels */}
        {activeTab === "live" && (
          <div className="live-wrapper">
            {/* Left side - Live Video */}
            <div className="live-video-container">
              <iframe
  className="live-video"
  src="https://www.youtube.com/embed/-VBxijFm50Y?autoplay=1&controls=0"
  title="Live Stream"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>

            </div>

            {/* Right side - Panels */}
            <div className="side-panel">
              {sideTabs.includes("savefeed") && (
                <div className="side-card">📂 Saved Feeds</div>
              )}
              {sideTabs.includes("emergency") && (
                <div className="side-card">🚨 Emergency Info</div>
              )}
              {sideTabs.includes("chat") && (
                <div className="side-card">💬 Live Chat</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
