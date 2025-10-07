import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocs 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Chat Utilities for Firebase Firestore
 * Shared functions for both parent and caretaker chat functionality
 */

export class ChatService {
  /**
   * Send a message to a specific chat room
   * @param {string} parentId - The parent's unique identifier
   * @param {Object} messageData - Message data object
   * @returns {Promise} - Promise that resolves when message is sent
   */
  static async sendMessage(parentId, messageData) {
    try {
      // Validate parentId
      if (!parentId || typeof parentId !== 'string' || parentId.trim() === '') {
        throw new Error('Invalid parentId: parentId must be a non-empty string');
      }

      const cleanParentId = parentId.trim();
      const messagesRef = collection(db, `chats/${cleanParentId}/messages`);
      const messageToSend = {
        ...messageData,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(messagesRef, messageToSend);
      console.log(`✅ Message sent with ID: ${docRef.id}`);
      return docRef;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  /**
   * Listen for messages in a specific chat room
   * @param {string} parentId - The parent's unique identifier
   * @param {Function} onMessageUpdate - Callback function when messages update
   * @returns {Function} - Unsubscribe function
   */
  static listenToMessages(parentId, onMessageUpdate) {
    try {
      // Validate parentId
      if (!parentId || typeof parentId !== 'string' || parentId.trim() === '') {
        throw new Error('Invalid parentId: parentId must be a non-empty string');
      }

      const cleanParentId = parentId.trim();
      const messagesRef = collection(db, `chats/${cleanParentId}/messages`);
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const messages = [];
          snapshot.docs.forEach(doc => {
            messages.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          console.log(`📨 Retrieved ${messages.length} messages for ${cleanParentId}`);
          onMessageUpdate(messages);
        },
        (error) => {
          console.error('❌ Error listening to messages:', error);
          throw error;
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up message listener:', error);
      throw error;
    }
  }

  /**
   * Get all active parent chats for caretaker dashboard
   * @returns {Promise<Array>} - Array of active chat rooms
   */
  static async getActiveChats() {
    try {
      // This is a simplified approach - in production, you might want to maintain
      // a separate collection for active chats
      const chatsRef = collection(db, 'chats');
      const snapshot = await getDocs(chatsRef);
      
      const activeChats = [];
      for (const chatDoc of snapshot.docs) {
        const messagesRef = collection(db, `chats/${chatDoc.id}/messages`);
        const messagesSnapshot = await getDocs(messagesRef);
        
        if (!messagesSnapshot.empty) {
          // Get the latest message to show parent info
          const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
          const latestSnapshot = await getDocs(messagesQuery);
          
          if (!latestSnapshot.empty) {
            const latestMessage = latestSnapshot.docs[0].data();
            activeChats.push({
              parentId: chatDoc.id,
              babyName: latestMessage.babyName || 'Unknown',
              lastMessage: latestMessage.text,
              lastTimestamp: latestMessage.timestamp,
              messageCount: messagesSnapshot.size
            });
          }
        }
      }
      
      return activeChats;
    } catch (error) {
      console.error('❌ Error getting active chats:', error);
      throw error;
    }
  }

  /**
   * Format message data for parent
   * @param {string} parentId - Parent's unique identifier
   * @param {string} text - Message text
   * @param {string} babyName - Baby's name
   * @returns {Object} - Formatted message object
   */
  static formatParentMessage(parentId, text, babyName) {
    return {
      text: text.trim(),
      senderId: parentId,
      senderType: 'parent',
      babyName: babyName.trim()
    };
  }

  /**
   * Format message data for caretaker
   * @param {string} caretakerId - Caretaker's unique identifier
   * @param {string} text - Message text
   * @returns {Object} - Formatted message object
   */
  static formatCaretakerMessage(caretakerId, text) {
    return {
      text: text.trim(),
      senderId: caretakerId,
      senderType: 'caretaker'
    };
  }

  /**
   * Create a unique parent ID based on user info
   * @param {Object} user - User object from auth context
   * @returns {string} - Unique parent identifier
   */
  static createParentId(user) {
    let baseId = 'anonymous_parent';
    
    if (user?.fullName && user.fullName.trim()) {
      baseId = user.fullName.trim();
    } else if (user?.username && user.username.trim()) {
      baseId = user.username.trim();
    } else if (user?.email && user.email.trim()) {
      baseId = user.email.split('@')[0];
    }
    
    // Clean the baseId and ensure it's valid
    const cleanId = baseId
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'parent';
    
    const timestamp = Date.now();
    return `${cleanId}_${timestamp}`;
  }

  /**
   * Validate message before sending
   * @param {string} text - Message text
   * @param {string} babyName - Baby's name (for parent messages)
   * @returns {Object} - Validation result
   */
  static validateMessage(text, babyName = null) {
    const result = { isValid: true, errors: [] };

    if (!text || !text.trim()) {
      result.isValid = false;
      result.errors.push('Message text is required');
    }

    if (text && text.trim().length > 1000) {
      result.isValid = false;
      result.errors.push('Message is too long (max 1000 characters)');
    }

    // For parent messages, baby name is required
    if (babyName !== null && (!babyName || !babyName.trim())) {
      result.isValid = false;
      result.errors.push('Baby name is required');
    }

    return result;
  }

  /**
   * Format timestamp for display
   * @param {Object} timestamp - Firebase timestamp
   * @returns {string} - Formatted time string
   */
  static formatTimestamp(timestamp) {
    if (!timestamp) return new Date().toLocaleTimeString();
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

export default ChatService;