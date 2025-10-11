import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import AgoraRTC from "agora-rtc-sdk-ng";
import ParentChat from "./ParentChat";
import "./HomePage.css";
import { db } from "../config/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";


const HomePage = () => {
  const { user, logout, protectedApiRequest } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [sideTabs, setSideTabs] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Agora video streaming state
  const [isVideoConnected, setIsVideoConnected] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [isVideoMaximized, setIsVideoMaximized] = useState(false);
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
  const appId = "008e752720ca4e8c9f7cf0dc1fc5b1b8";
  const channel = "testchannel";  // ✅ must match caretaker
  const token = "007eJxTYEgzWX7VaVrV82V5p47Lh4aEsy94d8d7yzYm3wA3aSfmhxEKDAYGFqnmpkbmRgbJiSapFsmWaebJaQYpyYZpyaZJhkkWfA9fZjQEMjL8z2ZhYWSAQBCfm6EktbgkOSMxLy81h4EBABOdIhQ=";
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
    console.log('[Nav] handleTabClick ->', { tab, activeTab, sideTabs });
    if (tab === "home") {
      setActiveTab("home");
      setSideTabs([]); // clear everything
    } else if (tab === "live") {
      setActiveTab("live"); // show iframe
      setSideTabs([]); // clear side panels
    } else {
      // Toggle side tab - if already open, close it
      if (sideTabs.includes(tab)) {
        const next = sideTabs.filter(t => t !== tab);
        console.log('[Nav] Removing side tab', { tab, next });
        setSideTabs(next);
      } else {
        // Add new side tab
        const next = [...sideTabs, tab];
        console.log('[Nav] Adding side tab', { tab, next });
        setSideTabs(next);
      }
      // ensure Live view is active so side panels render
      if (activeTab !== 'live') {
        console.log('[Nav] Switching activeTab to live to show side panels');
        setActiveTab('live');
      }
    }
  };

  // Debug: track when active tab or side tabs change
  useEffect(() => {
    console.log('[State] Tabs changed', { activeTab, sideTabs });
  }, [activeTab, sideTabs]);

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
            <h1>Welcome ❤</h1>
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
            <div className={`live-video-container ${isVideoMaximized ? 'maximized' : ''}`}>
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
                  {/* Minimize/Maximize Controls */}
                  <div className="video-resize-controls">
                    <button 
                      onClick={() => setIsVideoMaximized(!isVideoMaximized)}
                      className="resize-btn"
                      title={isVideoMaximized ? "Restore" : "Maximize"}
                    >
                      {isVideoMaximized ? "⛶" : "⛶"}
                    </button>
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
            <div className={`side-panel ${isVideoMaximized ? 'hidden' : ''}`}>
              {sideTabs.includes("savefeed") && (
                <div className="side-card">
                  <h4 style={{color: '#000'}}>📂 Saved Feeds</h4>
                  <p style={{color: '#000'}}>Access your recorded baby moments</p>
                  <button className="panel-btn">View Gallery</button>
                </div>
              )}
              {sideTabs.includes("emergency") && (
                <EmergencyPanel user={user} />
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

// EmergencyPanel - save emergency info to Firebase Firestore
const EmergencyPanel = ({ user }) => {
  const [doctorName, setDoctorName] = useState('');
  const [hospital, setHospital] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const parentId = (() => {
    try { return localStorage.getItem('parentId'); } catch { return null; }
  })() || user?.username || user?.email?.split('@')[0] || 'anonymous_parent';

  console.log('[EmergencyPanel] mount', { role: user?.role, parentId });

  // Prefill existing data from Firestore
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        if (!parentId) return;
        console.log('[EmergencyPanel] Loading emergency info from Firestore', { parentId });
        const docRef = doc(db, 'emergencyInfo', parentId);
        const snap = await getDoc(docRef);
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data();
          setDoctorName(data.pediatrician || '');
          setHospital(data.hospital || '');
          setParentPhone(data.emergencyNumber || '');
          console.log('[EmergencyPanel] Loaded emergency info from Firestore:', data);
        } else {
          console.warn('[EmergencyPanel] No emergency info found in Firestore for', parentId);
        }
      } catch (e) {
        console.error('[EmergencyPanel] Error loading emergency info:', e);
      }
    };
    
    // Load regardless of role (role may be undefined for some users)
    load();
    
    return () => { isMounted = false; };
  }, [parentId]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      if (!parentId) throw new Error('Missing parentId');
      console.log('[EmergencyPanel] Saving emergency info to Firestore', { parentId, doctorName, hospital, parentPhone });
      const docRef = doc(db, 'emergencyInfo', parentId);
      const dataToSave = {
        pediatrician: doctorName,
        hospital: hospital,
        emergencyNumber: parentPhone,
        updatedAt: serverTimestamp()
      };
      console.log('[EmergencyPanel] Data being saved:', dataToSave);
      await setDoc(docRef, dataToSave, { merge: true });
      console.log('[EmergencyPanel] Save successful');
      setMessage('Emergency information saved successfully. Caretakers can view this information.');
    } catch (err) {
      console.error('[EmergencyPanel] Save error', err);
      setMessage('Error saving emergency information');
    } finally {
      setSaving(false);
    }
  };

  // Always render for signed-in users (role may be undefined)
  if (!user) {
    console.warn('[EmergencyPanel] Not rendering: no user available');
    return null;
  }

  return (
    <div className="side-card emergency-panel">
      <h4 style={{color: '#000'}}>🏥 Emergency Information</h4>
      <div className="emergency-form">
        <label style={{color: '#000'}}>Doctor's Name</label>
        <input 
          type="text" 
          value={doctorName} 
          onChange={(e) => setDoctorName(e.target.value)} 
          className="child-input" 
          placeholder="Child's doctor name"
        />
        
        <label style={{color: '#000'}}>Hospital Name</label>
        <input 
          type="text" 
          value={hospital} 
          onChange={(e) => setHospital(e.target.value)} 
          className="child-input" 
          placeholder="Preferred hospital"
        />
        
        <label style={{color: '#000'}}>Parent's Phone Number</label>
        <input 
          type="tel" 
          value={parentPhone} 
          onChange={(e) => setParentPhone(e.target.value)} 
          className="child-input" 
          placeholder="Your contact number"
        />
        
        <div style={{ marginTop: '15px' }}>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="panel-btn emergency"
          >
            {saving ? 'Saving...' : 'Save Information'}
          </button>
          {message && <div style={{ marginTop: '10px', fontSize: '14px', color: '#000' }}>{message}</div>}
        </div>
      </div>
    </div>
  );
};
