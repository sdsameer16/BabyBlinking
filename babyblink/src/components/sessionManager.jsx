import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './SessionManager.css';

export default function SessionManager() {
  const { getUserSessions, terminateSession, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [terminating, setTerminating] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const result = await getUserSessions();
      if (result.success) {
        setSessions(result.data.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      setTerminating(sessionId);
      const result = await terminateSession(sessionId);
      if (result.success) {
        await loadSessions(); // Reload sessions
      }
    } catch (error) {
      console.error('Error terminating session:', error);
    } finally {
      setTerminating(null);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logout(true); // Logout from all devices
    } catch (error) {
      console.error('Error logging out from all devices:', error);
    }
  };

  const formatDeviceInfo = (deviceInfo) => {
    return `${deviceInfo.browser || 'Unknown'} on ${deviceInfo.os || 'Unknown'}`;
  };

  const formatLastActivity = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getDeviceIcon = (deviceInfo) => {
    const device = deviceInfo.device?.toLowerCase();
    if (device === 'mobile') return '📱';
    if (device === 'tablet') return '💻';
    return '🖥️';
  };

  if (loading) {
    return (
      <div className="session-manager">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading active sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="session-manager">
      <div className="session-header">
        <h2>🔐 Active Sessions</h2>
        <p>Manage your active sessions across different devices</p>
      </div>

      <div className="session-actions">
        <button 
          onClick={handleLogoutAll} 
          className="logout-all-btn"
        >
          🚪 Logout from All Devices
        </button>
        <button 
          onClick={loadSessions} 
          className="refresh-btn"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div className="no-sessions">
            <p>No active sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.id} 
              className={`session-item ${session.isCurrent ? 'current' : ''}`}
            >
              <div className="session-info">
                <div className="device-info">
                  <span className="device-icon">
                    {getDeviceIcon(session.deviceInfo)}
                  </span>
                  <div className="device-details">
                    <h4>
                      {formatDeviceInfo(session.deviceInfo)}
                      {session.isCurrent && (
                        <span className="current-badge">Current Session</span>
                      )}
                    </h4>
                    <p className="last-activity">
                      Last active: {formatLastActivity(session.lastActivity)}
                    </p>
                    <p className="session-created">
                      Created: {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="session-location">
                  <p>
                    📍 {session.deviceInfo.ip || 'Unknown location'}
                  </p>
                </div>
              </div>

              {!session.isCurrent && (
                <div className="session-actions">
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    disabled={terminating === session.id}
                    className="terminate-btn"
                  >
                    {terminating === session.id ? (
                      <>
                        <span className="spinner-small"></span>
                        Terminating...
                      </>
                    ) : (
                      '❌ Terminate'
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="session-info-note">
        <h3>📝 About Sessions</h3>
        <ul>
          <li>✅ Sessions are automatically synced across all your devices</li>
          <li>⏰ Sessions expire after 7 days of inactivity</li>
          <li>🔄 Tokens are automatically refreshed when needed</li>
          <li>🛡️ Your data is securely stored in MongoDB (not browser storage)</li>
          <li>🌍 Access your account from anywhere without re-login</li>
        </ul>
      </div>
    </div>
  );
}