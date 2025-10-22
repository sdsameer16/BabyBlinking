import React, { useState } from 'react';
import Join from './join';

function WebRTCApp() {
  const [joined, setJoined] = useState(false);
  const [isCaller, setIsCaller] = useState(false);
  const [roomId, setRoomId] = useState('');

  const joinRoom = () => {
    if (roomId.trim() === '') return alert('Enter room ID');
    setJoined(true);
  };

  const handleBack = () => {
    setJoined(false);
    setRoomId('');
    setIsCaller(false);
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: '40px',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {!joined ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h2 style={{
            color: '#333',
            marginBottom: '30px',
            fontSize: '2rem',
            fontWeight: '600'
          }}>
            🎥 KinderKares Live Session
          </h2>
          
          <div style={{ marginBottom: '30px' }}>
            <input
              placeholder="Enter Room ID (e.g., baby-room-1)"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 20px',
                fontSize: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
          
          <button 
            onClick={() => { setIsCaller(false); joinRoom(); }}
            style={{
              background: 'linear-gradient(135deg, #4CAF50, #45a049)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: '600',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
            }}
          >
            📹 Join Live Stream
          </button>
          
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '10px',
            fontSize: '14px',
            color: '#666'
          }}>
            <p style={{ margin: '0 0 10px 0' }}>
              💡 <strong>Instructions:</strong>
            </p>
            <p style={{ margin: '0' }}>
              Enter the Room ID provided by your caretaker to join the live video stream of your baby.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ width: '100%' }}>
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1000
          }}>
            <button
              onClick={handleBack}
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(10px)'
              }}
            >
              ← Back to Room Entry
            </button>
          </div>
          <Join roomId={roomId} isCaller={isCaller} />
        </div>
      )}
    </div>
  );
}

export default WebRTCApp;
