import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import AgoraRTC from "agora-rtc-sdk-ng";
import ParentChat from "./ParentChat";
import "./HomePage.css";


const HomePage = () => {
  const { user, logout, protectedApiRequest } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [sideTabs, setSideTabs] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Agora video streaming state
  const [isVideoConnected, setIsVideoConnected] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const clientRef = useRef(null);
  const videoContainerRef = useRef(null);
  
  // Firebase chat will be handled by ParentChat component

  // Load dashboard data and test protected routes
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        console.log('🔄 Loading dashboard data...');
        const result = await protectedApiRequest('/user/dashboard');
        
        if (result.success) {
          setDashboardData(result.data);
          console.log('✅ Dashboard loaded successfully');
        } else {
          console.error('❌ Dashboard load failed:', result.error);
          if (result.blocked) {
            console.log('🚫 User is blocked, will be logged out automatically');
          }
        }
      } catch (error) {
        console.error('❌ Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [protectedApiRequest]);

  // Agora RTC configuration
  const appId = "107e4f8b4ac448ed90e4af86f852656a";
  const channel = "testchannel";  // ✅ must match caretaker
  const token = "007eJxTYDBjFF3tJp7H8SX1zrY85nKmLF3b8sVnrJPy8r6zyJn9b1JgMDQwTzVJs0gySUw2MbFITbE0SDVJTLMwS7MwNTIzNUts3vQkoyGQkaE+4gcLIwMEgvjcDCWpxSXJGYl5eak5DAwAQEUgUw==";
  //"007eJxTYGhQuxTjOaWJI1piiWGM/ZnaF5MLLmgbb7G6pyVmd2nTJF0FBkMD81STNIskk8RkExOL1BRLg1STxDQLszQLUyMzU7PEXYueZDQEMjKEvpzFzMgAgSA+N0NJanFJckZiXl5qDgMDANJ6Ie0="

  // Initialize Agora client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      
      // Set up event listeners
      clientRef.current.on("user-published", async (user, mediaType) => {
        await clientRef.current.subscribe(user, mediaType);
        console.log(`📹 User ${user.uid} published ${mediaType}`);

        if (mediaType === "video" && videoContainerRef.current) {
          const remoteContainer = document.createElement("div");
          remoteContainer.id = `user-${user.uid}`;
          remoteContainer.className = "remote-video";
          remoteContainer.style.width = "100%";
          remoteContainer.style.height = "100%";
          remoteContainer.style.borderRadius = "10px";
          remoteContainer.style.overflow = "hidden";
          
          videoContainerRef.current.appendChild(remoteContainer);
          user.videoTrack.play(remoteContainer);
          setIsVideoConnected(true);
        }

        if (mediaType === "audio") {
          user.audioTrack.play();
        }
      });

      clientRef.current.on("user-unpublished", (user) => {
        console.log(`📹 User ${user.uid} unpublished`);
        const remoteContainer = document.getElementById(`user-${user.uid}`);
        if (remoteContainer) {
          remoteContainer.remove();
        }
        
        // Check if any videos are still connected
        if (videoContainerRef.current && videoContainerRef.current.children.length === 0) {
          setIsVideoConnected(false);
        }
      });
    }

    return () => {
      // Cleanup on component unmount
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, []);
  





  // Join video channel
  const joinVideoChannel = async () => {
    if (!clientRef.current) return;
    
    try {
      setVideoLoading(true);
      await clientRef.current.join(appId, channel, token, null);
      console.log("✅ Parent joined video channel in view mode");
    } catch (error) {
      console.error("❌ Failed to join video channel:", error);
    } finally {
      setVideoLoading(false);
    }
  };

  // Leave video channel
  const leaveVideoChannel = async () => {
    if (!clientRef.current) return;
    
    try {
      await clientRef.current.leave();
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = "";
      }
      setIsVideoConnected(false);
      console.log("✅ Parent left video channel");
    } catch (error) {
      console.error("❌ Failed to leave video channel:", error);
    }
  };

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
        {/* // In your navigation component
<Link to="/sessions">Manage Sessions</Link> */}
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
              <div className="video-header">
                <h3>👶 Baby Monitor Live Feed</h3>
                <div className="video-controls">
                  {!isVideoConnected ? (
                    <button 
                      onClick={joinVideoChannel} 
                      disabled={videoLoading}
                      className="join-btn"
                    >
                      {videoLoading ? "🔄 Connecting..." : "📹 Connect to Baby Cam"}
                    </button>
                  ) : (
                    <button 
                      onClick={leaveVideoChannel}
                      className="leave-btn"
                    >
                      📴 Disconnect
                    </button>
                  )}
                  <div className="connection-status">
                    <span className={`status-indicator ${isVideoConnected ? 'connected' : 'disconnected'}`}>
                      {isVideoConnected ? '🟢 Connected' : '🔴 Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div 
                ref={videoContainerRef}
                className="agora-video-container"
                id="video-container"
              >
                {!isVideoConnected && !videoLoading && (
                  <div className="no-video-placeholder">
                    <div className="placeholder-content">
                      <div className="baby-icon">👶</div>
                      <p>Click "Connect to Baby Cam" to start viewing</p>
                      <small>Make sure the caretaker device is broadcasting</small>
                    </div>
                  </div>
                )}
                {videoLoading && (
                  <div className="video-loading">
                    <div className="loading-spinner">🔄</div>
                    <p>Connecting to baby monitor...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Panels */}
            <div className="side-panel">
              {sideTabs.includes("savefeed") && (
                <div className="side-card">
                  <h4>📂 Saved Feeds</h4>
                  <p>Access your recorded baby moments</p>
                  <button className="panel-btn">View Gallery</button>
                </div>
              )}
              {sideTabs.includes("emergency") && (
                <div className="side-card">
                  <h4>🚨 Emergency Information</h4>
                  <div className="emergency-contacts">
                    <p><strong>Pediatrician:</strong> +1-234-567-8901</p>
                    <p><strong>Emergency:</strong> 911</p>
                    <p><strong>Poison Control:</strong> 1-800-222-1222</p>
                  </div>
                  <button className="panel-btn emergency">Quick Call</button>
                </div>
              )}
              {sideTabs.includes("chat") && (
                <div className="side-card chat-card">
                  <ParentChat />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
