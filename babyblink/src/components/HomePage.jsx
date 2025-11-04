import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ParentChat from "./ParentChat";
import WebRTCApp from "./WebRTCApp";
import "./HomePage.css";
import { db } from "../config/firebase";

// EmergencyPanel Component - Moved before HomePage
const EmergencyPanel = ({ user }) => {
  const { protectedApiRequest } = useAuth();
  const [doctorName, setDoctorName] = useState('');
  const [hospital, setHospital] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [childName, setChildName] = useState(() => {
    try {
      return localStorage.getItem('childName') || user?.babyName || '';
    } catch (e) {
      return user?.babyName || '';
    }
  });

  // Keep localStorage in sync when childName changes
  useEffect(() => {
    try {
      if (childName && childName.trim()) {
        localStorage.setItem('childName', childName.trim());
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [childName]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const parentId = (() => {
    try { return localStorage.getItem('parentId'); } catch { return null; }
  })() || user?.babyName || user?.username || user?.email?.split('@')[0] || 'anonymous_parent';

  console.log('[EmergencyPanel] mount', { role: user?.role, parentId, childName });

  // Prefill existing data from the unified parents endpoint
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        if (!parentId) return;
        console.log('[EmergencyPanel] Loading emergency info', { parentId });

        const result = await protectedApiRequest(`/parents/parent-info/${encodeURIComponent(parentId)}`);

        if (!isMounted) return;

        if (result?.success && result?.data) {
          setDoctorName(result.data.pediatrician || '');
          setParentPhone(result.data.emergencyNumber || '');
          setHospital(result.data.poisonControl || '');
          
          // Update childName from server if available
          const serverChildName = result.data.childName || result.data.babyName;
          if (serverChildName) {
            setChildName(serverChildName);
          }
        }

        console.log('[EmergencyPanel] Loaded data:', result?.data);
      } catch (e) {
        console.error('[EmergencyPanel] Error loading:', e);
      }
    };

    load();
    return () => { isMounted = false; };
  }, [parentId, protectedApiRequest]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      if (!parentId) throw new Error('Missing parentId');

      // Validate: require at least childName OR one other field
      const hasData = childName.trim() || doctorName.trim() || hospital.trim() || parentPhone.trim();
      if (!hasData) {
        setMessage('Please fill in at least one field');
        setSaving(false);
        return;
      }

      // IMPORTANT: Get the current childName value (not from localStorage during save)
      const currentChildName = childName.trim();
      
      console.log('[EmergencyPanel] Preparing to save with childName:', currentChildName);

      // 1. Save to unified backend (ParentInfo model)
      const unifiedPayload = {
        pediatrician: doctorName.trim() || undefined,
        emergencyNumber: parentPhone.trim() || undefined,
        poisonControl: hospital.trim() || undefined,
        babyName: currentChildName || undefined,
        childName: currentChildName || undefined // Include both for compatibility
      };

      console.log('[EmergencyPanel] Unified payload:', unifiedPayload);

      const result = await protectedApiRequest(
        `/parents/parent-info/${encodeURIComponent(parentId)}`, 
        {
          method: 'POST',
          body: JSON.stringify(unifiedPayload)
        }
      );

      let messages = [];
      if (result?.success) {
        messages.push('✅ Saved to unified backend');
      } else {
        messages.push(`⚠️ Unified backend: ${result?.error || 'Failed'}`);
      }

      // 2. Save to external MongoDB (Render API)
      try {
        // Construct payload with ALL fields filled (no empty strings)
        const externalPayload = {
          doctorName: doctorName.trim() || 'Not provided',
          hospital: hospital.trim() || 'Not provided',
          phoneNumber: parentPhone.trim() || 'Not provided',
          babyName: currentChildName || 'Not provided', // PRIMARY KEY
          childName: currentChildName || 'Not provided', // BACKUP KEY
          parentId: parentId || 'unknown'
        };

        console.log('[EmergencyPanel] External MongoDB payload:', externalPayload);
        console.log('[EmergencyPanel] Sending to:', '/api/doctors');

        const extResp = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(externalPayload)
        });

        console.log('[EmergencyPanel] MongoDB response status:', extResp.status);
        
        const extData = await extResp.json().catch(e => {
          console.error('[EmergencyPanel] Failed to parse MongoDB response:', e);
          return { success: false, error: 'Invalid JSON response' };
        });

        console.log('[EmergencyPanel] MongoDB response data:', extData);

        if (extResp.ok && extData.success !== false) {
          messages.push('✅ Saved to MongoDB (Render)');
          
          // Update localStorage with confirmed childName
          if (currentChildName) {
            try {
              localStorage.setItem('childName', currentChildName);
            } catch (e) {
              console.error('[EmergencyPanel] LocalStorage error:', e);
            }
          }
        } else {
          const errorMsg = extData.message || extData.error || extResp.statusText || `Status ${extResp.status}`;
          messages.push(`⚠️ MongoDB: ${errorMsg}`);
          console.error('[EmergencyPanel] MongoDB save failed:', errorMsg);
        }
      } catch (extErr) {
        console.error('[EmergencyPanel] MongoDB request failed:', extErr);
        messages.push(`❌ MongoDB: ${extErr.message || 'Network error'}`);
      }

      setMessage(messages.join(' | '));
    } catch (err) {
      console.error('[EmergencyPanel] Save error:', err);
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    console.warn('[EmergencyPanel] Not rendering: no user');
    return null;
  }

  return (
    <div className="side-card emergency-panel">
      <h4 style={{color: '#000'}}>🏥 Emergency Information</h4>
      <div className="emergency-form">
        <label style={{color: '#000'}}>Child's Name *</label>
        <input
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          className="child-input"
          placeholder="Enter child's name"
          style={{ marginBottom: '12px' }}
        />
        
        <label style={{color: '#000'}}>Doctor's Name</label>
        <input 
          type="text" 
          value={doctorName} 
          onChange={(e) => setDoctorName(e.target.value)} 
          className="child-input" 
          placeholder="Child's doctor name"
          style={{ marginBottom: '12px' }}
        />
        
        <label style={{color: '#000'}}>Hospital Name</label>
        <input 
          type="text" 
          value={hospital} 
          onChange={(e) => setHospital(e.target.value)} 
          className="child-input" 
          placeholder="Preferred hospital"
          style={{ marginBottom: '12px' }}
        />
        
        <label style={{color: '#000'}}>Parent's Phone Number</label>
        <input 
          type="tel" 
          value={parentPhone} 
          onChange={(e) => setParentPhone(e.target.value)} 
          className="child-input" 
          placeholder="Your contact number"
          style={{ marginBottom: '15px' }}
        />
        
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="panel-btn emergency"
        >
          {saving ? 'Saving...' : 'Save Information'}
        </button>
        
        {message && (
          <div style={{ 
            marginTop: '12px', 
            padding: '10px', 
            fontSize: '13px', 
            color: '#000',
            backgroundColor: message.includes('❌') ? '#fee' : '#efe',
            borderRadius: '4px',
            border: '1px solid ' + (message.includes('❌') ? '#fcc' : '#cfc')
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

// Main HomePage Component
const HomePage = () => {
  const { user, logout, protectedApiRequest } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [sideTabs, setSideTabs] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      </nav>

      {/* Content Section */}
      <div className="content">
        {/* Home Page */}
        {activeTab === "home" && (
          <div className="welcome-card">
            <h1>Welcome ❤</h1>
            <p>
              We're here to help you monitor and care for your baby with love,
              safety, and real-time support.
            </p>
          </div>
        )}

        {/* Live Section with side panels */}
        {activeTab === "live" && (
          <div className="live-wrapper">
            {/* WebRTC Video Component with Room Entry */}
            <div style={{ flex: 1, minWidth: '60%' }}>
              <WebRTCApp />
            </div>

            {/* Right side - Panels */}
            {sideTabs.length > 0 && (
              <div className="side-panel">
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// CRITICAL: Default export at the end
export default HomePage;