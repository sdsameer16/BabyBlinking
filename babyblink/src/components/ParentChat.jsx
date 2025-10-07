import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp, 
    getDoc, 
    getDocs,
    setDoc,
    limit
} from 'firebase/firestore';
import './ParentChat.css';

// --- CORRECTED CONFIGURATION ---
// This now matches your "chtbot-74fc8" project and the caretaker app.
const firebaseConfig = {
    apiKey: "AIzaSyCNt3ed_bf4wojnqqdNAueci5JPg3JD920",
    authDomain: "chtbot-74fc8.firebaseapp.com",
    projectId: "chtbot-74fc8",
    storageBucket: "chtbot-74fc8.firebasestorage.app",
    messagingSenderId: "452786665417",
    appId: "1:452786665417:web:08ffb8817362130a595a18",
    measurementId: "G-XN4M4YB2R4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// This must match the projectId in the config above and in the caretaker app
const appId = 'chtbot-74fc8';

const ParentChat = ({ isVisible = true, className = '' }) => {
    const [parentId, setParentId] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [assignedCaretakerId, setAssignedCaretakerId] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Authenticate the user anonymously when the component mounts
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("Parent Auth: User is signed in.", user.uid);
                setError('');
                setIsLoading(false);
            } else {
                signInAnonymously(auth).catch((err) => {
                    console.error("Parent Auth: Anonymous sign-in failed.", err);
                    setError('Firebase connection failed. Please refresh.');
                    setIsLoading(false);
                });
            }
        });
    }, []);
    
    useEffect(() => {
        if (isLoggedIn && assignedCaretakerId) {
            const messagesRef = collection(db, `artifacts/${appId}/public/data/chats/${parentId}/messages`);
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMessages(msgs);
            }, (err) => {
                console.error("Failed to fetch messages:", err);
                setError("Could not load messages.");
            });

            return () => unsubscribe();
        }
    }, [isLoggedIn, parentId, assignedCaretakerId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleLogin = async () => {
        const currentParentId = parentId.trim();
        if (!currentParentId) {
            setError('Parent ID cannot be empty.');
            return;
        }
        
        setIsLoading(true);
        setError('');

        try {
            const parentRef = doc(db, `artifacts/${appId}/public/data/parents`, currentParentId);
            const parentSnap = await getDoc(parentRef);

            let caretakerId;

            if (parentSnap.exists() && parentSnap.data().assignedCaretakerId) {
                caretakerId = parentSnap.data().assignedCaretakerId;
                console.log(`Parent ${currentParentId} already assigned to ${caretakerId}`);
            } else {
                console.log(`Assigning a new caretaker for parent ${currentParentId}`);
                const caretakersRef = collection(db, `artifacts/${appId}/public/data/caretakers`);
                const q = query(caretakersRef, orderBy('lastActive', 'desc'), limit(5));
                const caretakerSnapshot = await getDocs(q);

                if (caretakerSnapshot.empty) {
                    setError('No active caretakers available. Please try again later.');
                    setIsLoading(false);
                    return;
                }
                
                // For simplicity, assign to the most recently active caretaker.
                // A real-world scenario might involve more complex load balancing.
                caretakerId = caretakerSnapshot.docs[0].id;

                await setDoc(parentRef, { 
                    id: currentParentId, 
                    assignedCaretakerId: caretakerId,
                    lastUpdate: serverTimestamp()
                }, { merge: true });

                 console.log(`Parent ${currentParentId} has been assigned to caretaker ${caretakerId}`);
            }

            setAssignedCaretakerId(caretakerId);
            setIsLoggedIn(true);
        } catch (err) {
            console.error("Login or assignment failed:", err);
            setError("Failed to log in or find a caretaker. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const text = newMessage.trim();
        if (!text) return;

        const messagesRef = collection(db, `artifacts/${appId}/public/data/chats/${parentId}/messages`);
        const parentRef = doc(db, `artifacts/${appId}/public/data/parents`, parentId);
        
        try {
            setNewMessage('');
            await addDoc(messagesRef, {
                text: text,
                senderId: parentId,
                senderType: 'parent',
                timestamp: serverTimestamp(),
            });

            // Update parent document with last message for caretaker's view
            await setDoc(parentRef, {
                lastMessage: text,
                lastUpdate: serverTimestamp()
            }, { merge: true });

        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Could not send message.');
        }
    };

    if (!isVisible) return null;

    if (!isLoggedIn) {
        return (
            <div className="p-4 bg-gray-100 rounded-lg h-full flex flex-col items-center justify-center">
                <h4 className="font-bold text-lg mb-2 text-gray-800">Parent Live Chat</h4>
                <p className="text-sm text-gray-600 mb-4">Enter a unique ID to start chatting.</p>
                <input
                    type="text"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    placeholder="Enter your Parent ID"
                    className="w-full px-3 py-2 border rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <button onClick={handleLogin} disabled={isLoading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50">
                    {isLoading ? 'Connecting...' : 'Login'}
                </button>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white rounded-lg">
            <div className="p-3 bg-gray-100 border-b rounded-t-lg">
                <h4 className="font-bold text-center text-gray-800">Chat with Caretaker</h4>
                <p className="text-xs text-center text-gray-500">You are: {parentId}</p>
            </div>
            <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex my-2 ${msg.senderType === 'parent' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.senderType === 'parent' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                           <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t bg-gray-100 rounded-b-lg">
                <div className="flex items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700">Send</button>
                </div>
            </form>
        </div>
    );
};

export default ParentChat;