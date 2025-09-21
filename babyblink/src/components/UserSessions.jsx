import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserSessions() {
  const { getUserSessions, logoutAllDevices } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    const result = await getUserSessions();
    
    if (result.success) {
      setSessions(result.sessions || []);
    } else {
      setMessage('Failed to load sessions');
    }
    
    setLoading(false);
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to logout from all devices? This will end all active sessions.')) {
      return;
    }

    const result = await logoutAllDevices();
    
    if (result.success) {
      setMessage('Successfully logged out from all devices');
      // User will be redirected as they're logged out
    } else {
      setMessage('Failed to logout from all devices');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getBrowserName = (userAgent) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const getDeviceType = (userAgent) => {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading sessions...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Active Sessions</h2>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px',
          background: '#f0f8ff',
          border: '1px solid #007bff',
          borderRadius: '5px',
          color: '#007bff'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleLogoutAllDevices}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout from All Devices
        </button>
      </div>

      {sessions.length === 0 ? (
        <p>No active sessions found.</p>
      ) : (
        <div>
          <p>You have {sessions.length} active session(s):</p>
          
          {sessions.map((session, index) => (
            <div 
              key={session.id}
              style={{
                border: session.isCurrent ? '2px solid #28a745' : '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '10px',
                background: session.isCurrent ? '#f8fff9' : '#f8f9fa'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: session.isCurrent ? '#28a745' : '#333' }}>
                    {getBrowserName(session.deviceInfo.userAgent)} on {getDeviceType(session.deviceInfo.userAgent)}
                    {session.isCurrent && ' (Current Session)'}
                  </h4>
                  
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <div><strong>IP Address:</strong> {session.deviceInfo.ip}</div>
                    <div><strong>Created:</strong> {formatDate(session.createdAt)}</div>
                    <div><strong>Last Activity:</strong> {formatDate(session.lastActivity)}</div>
                  </div>
                </div>
                
                <div>
                  {session.isCurrent ? (
                    <span style={{
                      background: '#28a745',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '15px',
                      fontSize: '12px'
                    }}>
                      Current
                    </span>
                  ) : (
                    <span style={{
                      background: '#6c757d',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '15px',
                      fontSize: '12px'
                    }}>
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <p><strong>Security Note:</strong> If you see sessions you don't recognize, click "Logout from All Devices" immediately and change your password.</p>
      </div>
    </div>
  );
}