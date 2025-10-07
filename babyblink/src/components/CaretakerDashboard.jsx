import React, { useState, useEffect, useRef } from 'react';
import ChatService from '../utils/chatService';
import './CaretakerDashboard.css';

const CaretakerDashboard = () => {
  const [caretakerId] = useState('caretaker_dashboard');
  const [activeChats, setActiveChats] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  // Load active chats on component mount and periodically
  useEffect(() => {
    loadActiveChats();
    
    // Refresh active chats every 30 seconds
    const interval = setInterval(loadActiveChats, 30000);
    
    return () => {
      clearInterval(interval);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadActiveChats = async () => {
    try {
      setRefreshing(true);
      const chats = await ChatService.getActiveChats();
      
      // Sort by most recent activity
      chats.sort((a, b) => {
        if (!a.lastTimestamp || !b.lastTimestamp) return 0;
        return b.lastTimestamp.seconds - a.lastTimestamp.seconds;
      });
      
      setActiveChats(chats);
      console.log(`✅ Loaded ${chats.length} active chats`);
      
    } catch (error) {
      console.error('❌ Failed to load active chats:', error);
      setError('Failed to load active chats. Please refresh.');
    } finally {
      setRefreshing(false);
    }
  };

  const selectParent = (parentInfo) => {
    try {
      // Validate parentInfo
      if (!parentInfo || !parentInfo.parentId || parentInfo.parentId.trim() === '') {
        setError('Invalid parent information.');
        return;
      }

      // Clean up previous listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      setSelectedParent(parentInfo);
      setMessages([]);
      setError('');
      setLoading(true);

      console.log(`🔄 Selecting parent: ${parentInfo.parentId} (${parentInfo.babyName})`);

      // Start listening to messages for this parent
      const unsubscribe = ChatService.listenToMessages(parentInfo.parentId, (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      });

      unsubscribeRef.current = unsubscribe;
      console.log(`✅ Selected parent: ${parentInfo.parentId} (${parentInfo.babyName})`);
      
    } catch (error) {
      console.error('❌ Failed to select parent:', error);
      setError('Failed to load messages for this parent.');
      setLoading(false);
    }
  };

  const sendReply = async () => {
    const validation = ChatService.validateMessage(messageInput);
    if (!validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    if (!selectedParent || !selectedParent.parentId || selectedParent.parentId.trim() === '') {
      setError('Please select a valid parent first.');
      return;
    }

    const currentMessage = messageInput;
    setMessageInput(''); // Clear input immediately
    setError('');

    try {
      await ChatService.sendMessage(
        selectedParent.parentId,
        ChatService.formatCaretakerMessage(caretakerId, currentMessage)
      );

      console.log(`📤 Reply sent to ${selectedParent.parentId}: ${currentMessage}`);
      
    } catch (error) {
      console.error('❌ Failed to send reply:', error);
      setError('Failed to send reply. Please try again.');
      setMessageInput(currentMessage); // Restore message on error
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="caretaker-dashboard">
      <header className="dashboard-header">
        <h1>🍼 Caretaker Dashboard</h1>
        <p>Monitor and respond to parent messages</p>
      </header>

      <div className="dashboard-content">
        {/* Left Panel - Active Chats */}
        <div className="active-chats-panel">
          <div className="panel-header">
            <h3>Active Parent Chats</h3>
            <button 
              onClick={loadActiveChats}
              disabled={refreshing}
              className="refresh-btn"
            >
              {refreshing ? '🔄' : '🔃'}
            </button>
          </div>

          <div className="chats-list">
            {activeChats.length === 0 ? (
              <div className="no-chats">
                <p>No active chats found</p>
                <small>Parents will appear here when they start chatting</small>
              </div>
            ) : (
              activeChats.map(chat => (
                <div 
                  key={chat.parentId}
                  className={`chat-item ${selectedParent?.parentId === chat.parentId ? 'selected' : ''}`}
                  onClick={() => selectParent(chat)}
                >
                  <div className="chat-info">
                    <div className="chat-primary">
                      <span className="baby-name">👶 {chat.babyName}</span>
                      <span className="message-count">{chat.messageCount}</span>
                    </div>
                    <div className="chat-secondary">
                      <span className="parent-id">{chat.parentId}</span>
                      <span className="last-activity">
                        {formatLastActivity(chat.lastTimestamp)}
                      </span>
                    </div>
                    {chat.lastMessage && (
                      <div className="last-message">
                        {chat.lastMessage.length > 50 
                          ? `${chat.lastMessage.substring(0, 50)}...` 
                          : chat.lastMessage
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="chat-interface">
          {!selectedParent ? (
            <div className="no-selection">
              <div className="no-selection-content">
                <div className="icon">💬</div>
                <h3>Select a Parent to Chat</h3>
                <p>Choose a parent from the left panel to view their messages and respond</p>
              </div>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="selected-parent-info">
                  <h3>👶 {selectedParent.babyName}</h3>
                  <span className="parent-id-small">Parent: {selectedParent.parentId}</span>
                </div>
                <div className="chat-stats">
                  <span>{messages.length} messages</span>
                </div>
              </div>

              <div className="messages-container">
                {loading ? (
                  <div className="loading-messages">
                    <div className="loading-spinner">🔄</div>
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages yet from this parent</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`message ${msg.senderType === 'parent' ? 'from-parent' : 'from-caretaker'}`}
                    >
                      <div className="message-content">
                        <div className="message-header">
                          <strong>
                            {msg.senderType === 'parent' 
                              ? `👶 ${msg.babyName || 'Parent'}` 
                              : '👩‍⚕️ You'
                            }
                          </strong>
                          <span className="message-time">
                            {ChatService.formatTimestamp(msg.timestamp)}
                          </span>
                        </div>
                        <p className="message-text">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}

              <div className="reply-container">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Reply to ${selectedParent.babyName}'s parent...`}
                  className="reply-input"
                  disabled={loading}
                />
                <button 
                  onClick={sendReply}
                  disabled={!messageInput.trim() || loading}
                  className="reply-btn"
                >
                  📤 Reply
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaretakerDashboard;