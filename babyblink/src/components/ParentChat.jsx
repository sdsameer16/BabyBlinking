import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../contexts/AuthContext";

const socket = io("https://livechatapp-1-7362.onrender.com");

const ParentChat = () => {
  const { user } = useAuth();
  const [parentName, setParentName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const notificationRef = useRef(null);

  // Auto-populate baby name from user data and auto-register
  useEffect(() => {
    if (user && user.babyName) {
      setParentName(user.babyName);
      console.log('👶 Auto-populated baby name:', user.babyName);
      // Auto-register with the baby name
      setIsRegistered(true);
    }
  }, [user]);

  const handleRegister = () => {
    if (!parentName.trim()) {
      toast.error("Please enter a parent name");
      return;
    }
    setIsRegistered(true);
  };

    useEffect(() => {
    if (isRegistered && parentName) {
      // Register with the backend
      socket.emit("register", { role: "parent", parentId: parentName });

      // Load messages for this parent
      axios.get(`https://livechatapp-1-7362.onrender.com/messages/${parentName}`).then((res) => {
        setChat(res.data);
      });

      // Listen for messages for this parent
      socket.on("receiveFromCaretaker", (data) => {
        setChat((prev) => [...prev, { sender: "caretaker", message: data.message, timestamp: new Date() }]);
        toast.info("New message from caretaker!");
        playNotification();
      });

      socket.on("typingFromCaretaker", () => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      });

      return () => {
        socket.off("receiveFromCaretaker");
        socket.off("typingFromCaretaker");
      };
    }
  }, [isRegistered, parentName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Preload notification audio once and reuse it to avoid creating many Audio objects
  useEffect(() => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.preload = 'auto';
      notificationRef.current = audio;
    } catch (e) {
      console.warn('Could not initialize notification audio:', e);
      notificationRef.current = null;
    }
    // no cleanup needed for Audio object
  }, []);

  const playNotification = () => {
    const audio = notificationRef.current;
    if (!audio) return;
    // Play returns a promise; handle potential user gesture / autoplay blocks
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch((err) => {
        // Ignore NotAllowedError (autoplay blocked) but log for debugging
        console.debug('Notification play error:', err?.name || err?.message || err);
      });
    }
  };

  const handleTyping = () => {
    if (isRegistered) {
      socket.emit("typing", { role: "parent", parentId: parentName });
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !isRegistered) return;
    socket.emit("parentMessage", { parentId: parentName, message });
    setChat((prev) => [...prev, { sender: "parent", message, timestamp: new Date() }]);
    setMessage("");
  };


  // Show registration form if not registered
  if (!isRegistered) {
    return (
      <div style={{ width: 400, margin: "auto", padding: 20, fontFamily: "Poppins", textAlign: "center" }}>
        <h3>👩‍👦 Parent Chat</h3>
        <p>Connecting with your baby's name...</p>
        <div style={{ marginTop: 20 }}>
          <div className="animate-spin text-2xl mb-2 text-center">🔄</div>
          <p>Loading chat interface...</p>
        </div>
        <ToastContainer position="bottom-right" />
      </div>
    );
  }

    return (
    <div style={{ width: 500, margin: "auto", padding: 20, fontFamily: "Poppins" }}>
      <h3>👩‍👦 Parent Chat</h3>

      <div style={{ marginBottom: 20, fontSize: 18, fontWeight: "bold", color: "#333" }}>
        Logged in as: <span style={{ color: "#4CAF50" }}>{parentName}</span>
      </div>

      <div
        style={{
          border: "1px solid gray",
          height: 350,
          overflowY: "scroll",
          padding: 10,
          borderRadius: 10,
          marginBottom: 10,
          background: "#f9f9f9",
        }}
      >
        {chat.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.sender === "parent" ? "right" : "left",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: 15,
                background: msg.sender === "parent" ? "#DCF8C6" : "#EAEAEA",
                color: "black",
              }}
            >
              {msg.message}
            </div>
            <div style={{ fontSize: "10px", color: "black" }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

      {isTyping && <div style={{ color: "black" }}>Caretaker is typing...</div>}

                    <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleTyping}
        placeholder="Type message..."
        style={{ width: "70%", borderRadius: 20, padding: 8 }}
      />
      <button onClick={sendMessage}>Send</button>
      <ToastContainer position="bottom-right" />
        </div>
    );
};

export default ParentChat;
