import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase Configuration
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

// Initialize Firestore
export const db = getFirestore(app);

export default app;