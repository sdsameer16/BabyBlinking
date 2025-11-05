
# 👶 KinderKares Baby Blink

**Real-time Baby Monitoring Platform with Live Video Streaming**

KinderKares Baby Blink is a comprehensive web application that enables parents to remotely monitor their babies through live video streaming and real-time communication with caretakers. The platform provides secure authentication, emergency information management, and WebRTC-based video streaming.

---

## 🌟 Features

### 👨‍👩‍👧 For Parents
- **Live Video Streaming**: Watch your baby in real-time through WebRTC technology
- **Real-time Chat**: Communicate instantly with caretakers via Socket.io
- **Emergency Information Management**: Store and manage pediatrician, emergency contacts, and hospital details
- **Secure Registration & Login**: Email-based OTP verification system
- **Password Recovery**: Forgot password functionality with email-based reset codes
- **User Profile Management**: Update personal and baby information
- **Multi-device Support**: Access from desktop and mobile devices

### 👨‍⚕️ For Caretakers
- **Live Streaming**: Stream video feed to parents in real-time
- **Parent Chat**: Communicate with parents instantly
- **Emergency Info Access**: Quick access to critical emergency information
- **Admin Dashboard**: Manage users and monitor system activity

### 🔐 Security Features
- **JWT Authentication**: Secure token-based authentication
- **Email Verification**: OTP-based email verification for new registrations
- **Password Encryption**: Bcrypt password hashing
- **Session Management**: Automatic session timeout and renewal
- **User Blocking**: Admin capability to block/unblock users

---

## ⚠️ Known Limitations & Solutions

### 📧 Email Service Configuration (Registration)

**Current Status**: Email service requires proper Gmail App Password configuration for OTP delivery during registration.

**Why This Happens**:
- Gmail has strict security policies requiring App Passwords for third-party applications
- Standard Gmail passwords are blocked by Google for security reasons
- Free-tier hosting (Render) may experience cold starts affecting email delivery timing

**✅ Complete Solution**:

1. **Enable 2-Step Verification** on your Google Account:
   - Visit: https://myaccount.google.com/security
   - Click "2-Step Verification" → Follow setup steps

2. **Generate Gmail App Password**:
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "KinderKares Baby Blink"
   - Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
   - Remove spaces when adding to Render

3. **Configure Render Backend**:
   - Go to Render Dashboard → Your Backend Service
   - Navigate to "Environment" tab
   - Add/Update these variables:
     ```
     EMAIL_USER=your.email@gmail.com
     EMAIL_PASS=xxxxxxxxxxxxxxxx (16 chars, no spaces)
     SKIP_EMAIL=false
     ```
   - Click "Save Changes" (auto-redeploys)

4. **Test Email Configuration**:
   ```powershell
   # PowerShell
   Invoke-RestMethod -Uri "https://babyblinking.onrender.com/api/auth/test-email" -Method POST -ContentType "application/json"
   
   # Expected Response:
   # {"success": true, "message": "Test email sent successfully!"}
   ```

5. **Verify Registration**:
   - Register a new user
   - Check email inbox (and spam folder)
   - OTP should arrive within 60 seconds
   - If delayed, check Render logs for specific errors

**Alternative Email Providers**:
If Gmail doesn't work, consider these alternatives:
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **AWS SES** (Pay as you go)

Update `backend/routes/auth.js` transporter configuration for other providers.

---

### 🎥 Live Video Autoplay on Mobile

**Current Status**: Mobile browsers (iOS Safari, Chrome) block video autoplay due to browser policies. Video stream connects successfully but shows black screen until user interaction.

**Why This Happens**:
- **Browser Security Policy**: Mobile browsers require user interaction (tap/click) before playing video with audio
- **Bandwidth Conservation**: Prevents unwanted data usage on cellular networks
- **User Experience**: Gives users control over when media plays
- **iOS Safari Restrictions**: Strictest autoplay policies among all browsers

**✅ User Experience Solution (Implemented)**:

The app handles this gracefully with multiple fallback mechanisms:

1. **Visual Feedback**:
   - Shows "🟢 LIVE Connected" status when stream is received
   - Video element displays stream but waits for user tap

2. **Mobile User Instructions**:
   ```
   For Users on Mobile:
   1. Wait for "🟢 LIVE Connected" status
   2. Tap anywhere on the video screen
   3. Video will immediately start playing
   ```

3. **Technical Implementation**:
   - Video element has `playsInline` attribute (prevents fullscreen on iOS)
   - Video has `autoPlay` attribute (works on desktop and some mobiles)
   - Click handler on video element triggers manual `.play()`
   - Promise-based play handling catches autoplay blocks

**✅ For Developers - Additional Enhancements Available**:

If you want to improve the mobile experience further, here are optional enhancements:

**Option A: Add Visual Play Button Overlay**
```jsx
// Add to join.jsx when video is connected but not playing
{isConnected && videoRef.current?.paused && (
  <div onClick={() => videoRef.current.play()} 
       style={{position: 'absolute', ...}}>
    <PlayButton />
    <p>Tap to Start Video</p>
  </div>
)}
```

**Option B: Add STUN/TURN Servers** (Better cross-network connectivity)
```jsx
// Update SimplePeer config in join.jsx
new SimplePeer({
  initiator: false,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }
})
```

**Option C: Progressive Web App (PWA)** 
- Convert to PWA for better mobile integration
- PWAs have relaxed autoplay restrictions
- Add `manifest.json` and service worker

**Best Practices for Users**:
- ✅ Use on WiFi for best experience
- ✅ Keep caretaker and parent on same network if possible
- ✅ Update to latest browser version
- ✅ Grant camera/microphone permissions when prompted
- ✅ Close other apps using camera/microphone
- ✅ Wait 30-60 seconds on first load (server cold start)

**Browser Compatibility**:
| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ Auto | 👆 Tap | Best overall support |
| Firefox | ✅ Auto | 👆 Tap | Good WebRTC support |
| Safari | ✅ Auto | 👆 Tap | Requires playsInline |
| Edge | ✅ Auto | 👆 Tap | Chromium-based |
| Opera | ✅ Auto | 👆 Tap | Good support |

**Current Status**: ✅ **Implemented and Working** - Users just need to tap video on mobile

---

## 🔍 Additional Troubleshooting

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Simple Peer** - WebRTC peer connections
- **Firebase** - Real-time database for chat
- **Axios** - HTTP client

### Backend
- **Node.js & Express** - Server framework
- **MongoDB & Mongoose** - Database
- **JWT** - Authentication tokens
- **Nodemailer** - Email service
- **Socket.io** - WebSocket server
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Deployment
- **Frontend**: Netlify
- **Backend**: Render
- **Database**: MongoDB Atlas
- **Video Server**: Render (separate WebRTC signaling server)
- **Chat Server**: Render (separate Socket.io server)

---

## 📋 Prerequisites

- **Node.js** 16.x or higher
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Gmail Account** (for email service with App Password)
- **Git**

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/sdsameer16/BabyBlinking.git
cd BabyBlinking/babyblink
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd babyblink

# Install dependencies
npm install

# Create .env file for development
cp .env.example .env
```

**Frontend Environment Variables** (`.env`):
```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:3001
VITE_WEBRTC_URL=http://localhost:3002

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Backend Environment Variables** (`.env`):
```bash
# Server
PORT=5000
CORS_ORIGIN=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/babyblink
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/babyblink?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_REFRESH_SECRET=your_refresh_secret_key
REFRESH_TOKEN_TIMEOUT=7d
SESSION_TIMEOUT=24h

# Email Service (Gmail)
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_16_character_app_password
SKIP_EMAIL=false
```

### 4. Gmail App Password Setup

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate password for "Mail" → "Other (Custom name)" → "Baby Blink"
5. Copy the 16-character password (remove spaces)
6. Add to `.env` as `EMAIL_PASS`

### 5. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Start MongoDB service
mongod

# Database will be created automatically
```

**Option B: MongoDB Atlas** (Recommended for production)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Add to `.env` as `MONGO_URI`

---

## 🏃‍♂️ Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd babyblink
npm run dev
```
App runs on: `http://localhost:5173`

### Production Build

**Frontend:**
```bash
npm run build
npm run preview  # Preview production build
```

---

## 🌐 Deployment

### Frontend Deployment (Netlify)

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables** (Netlify Dashboard):
   ```
   VITE_API_URL=https://babyblinking.onrender.com/api
   VITE_SOCKET_URL=https://livechatapp-1-7362.onrender.com
   VITE_WEBRTC_URL=https://livevideowebrtc.onrender.com
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```

### Backend Deployment (Render)

1. **Build Command**: `npm install`
2. **Start Command**: `node server.js`
3. **Environment Variables** (Render Dashboard):
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   EMAIL_USER=...
   EMAIL_PASS=...
   SKIP_EMAIL=false
   CORS_ORIGIN=https://your-netlify-site.netlify.app
   PORT=5000
   ```

---

## 📁 Project Structure

```
babyblink/
├── backend/                 # Backend server
│   ├── middleware/         # Auth & validation middleware
│   │   ├── authBlockCheck.js
│   │   ├── blockCheck.js
│   │   └── sessionAuth.js
│   ├── models/            # Mongoose schemas
│   │   ├── User.js
│   │   ├── ParentInfo.js
│   │   ├── Doctor.js
│   │   ├── Hospital.js
│   │   ├── EmergencyPhone.js
│   │   └── Session.js
│   ├── routes/            # API routes
│   │   ├── auth.js       # Authentication
│   │   ├── parents.js    # Parent info
│   │   ├── user.js       # User management
│   │   └── emergency.js  # Emergency contacts
│   ├── services/         # Business logic
│   │   └── emailService.js
│   ├── .env              # Environment variables
│   ├── .env.example      # Environment template
│   └── server.js         # Entry point
│
├── src/                   # Frontend source
│   ├── components/       # React components
│   │   ├── LandingPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── CaretakerDashboard.jsx
│   │   ├── SessionManager.jsx
│   │   ├── WebRTCApp.jsx
│   │   ├── join.jsx
│   │   ├── ParentChat.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/         # React Context
│   │   └── AuthContext.jsx
│   ├── config/           # Configuration
│   │   └── firebase.js
│   ├── utils/            # Utilities
│   │   ├── socket.js
│   │   └── chatService.js
│   ├── assets/           # Images & media
│   ├── App.jsx           # Root component
│   └── main.jsx          # Entry point
│
├── public/               # Static assets
│   └── notification.mp3
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies
└── README.md             # Documentation
```

---

## 🔧 Key Configuration Files

### `vite.config.js`
```javascript
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  server: {
    proxy: {
      '/api': {
        target: 'https://babyblinking.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
```

### Backend `server.js`
- Express server setup
- MongoDB connection
- CORS configuration
- Route registration
- Error handling middleware

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify email OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/test-email` - Test email configuration

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/dashboard` - Get dashboard data

### Parent Information
- `POST /api/parents/parent-info/:parentId` - Save emergency info
- `GET /api/parents/parent-info/:parentId` - Get emergency info

### Emergency Contacts
- CRUD operations for doctors, hospitals, emergency phones

---

## 🎥 WebRTC Architecture

### Video Streaming Flow:
1. **Caretaker** starts camera stream (MediaStream API)
2. **SimplePeer** creates WebRTC peer connection
3. **Socket.io** handles signaling (offer/answer exchange)
4. **Parent** receives stream and displays in video element
5. **STUN servers** help with NAT traversal

### Key Components:
- `WebRTCApp.jsx` - Room entry and management
- `join.jsx` - Video player and peer connection
- `socket.js` - Socket.io client configuration

---

## 💬 Chat System

### Features:
- Real-time messaging via Socket.io
- Firebase Firestore for message persistence
- Audio notifications for new messages
- Typing indicators
- Auto-scroll to latest message

### Architecture:
- Socket.io for real-time events
- Firebase for message storage
- Separate chat server on Render

---

## 🔍 Troubleshooting

### Email Not Sending
**Issue**: Registration fails with "Unable to send verification email"

**Solutions**:
1. Verify `EMAIL_USER` and `EMAIL_PASS` in backend environment variables
2. Ensure Gmail App Password is created correctly (16 characters)
3. Check `SKIP_EMAIL=false` in environment
4. Check Render logs for specific nodemailer errors
5. Test with: `POST https://babyblinking.onrender.com/api/auth/test-email`

### Video Not Playing on Mobile
**Issue**: Black screen on mobile despite "Connected" status

**Solutions**:
1. Tap the video to manually start playback
2. Check browser console for autoplay blocks
3. Ensure `playsInline` attribute is set
4. Verify video tracks are enabled in stream
5. Try refreshing the page

### CORS Errors
**Issue**: "No 'Access-Control-Allow-Origin' header"

**Solutions**:
1. Verify `CORS_ORIGIN` in backend includes your frontend URL
2. Use Vite dev proxy for local development
3. Ensure backend server is running
4. Check Netlify deployment URL matches CORS_ORIGIN

### WebRTC Connection Failed
**Issue**: "Peer error: Connection failed"

**Solutions**:
1. Wait 30-60 seconds for server to wake up (free tier)
2. Ensure caretaker is actively streaming
3. Check if firewall/VPN is blocking WebRTC
4. Try on same WiFi network
5. Add STUN/TURN servers if needed

### MongoDB Connection Failed
**Issue**: "MongoNetworkError" or connection timeout

**Solutions**:
1. Verify `MONGO_URI` format is correct
2. Check MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)
3. Verify database user credentials
4. Test connection string locally first

---

## 🧪 Testing

### Manual Testing Checklist:

**Registration Flow:**
- [ ] Register with valid email
- [ ] Receive OTP email within 1 minute
- [ ] Verify OTP successfully
- [ ] Login with new credentials

**Video Streaming:**
- [ ] Caretaker can start stream
- [ ] Parent receives video feed
- [ ] Video plays on desktop
- [ ] Video plays on mobile (tap if needed)
- [ ] Audio is audible
- [ ] Fullscreen works

**Chat System:**
- [ ] Messages send/receive in real-time
- [ ] Notification sound plays
- [ ] Typing indicators work
- [ ] Messages persist after refresh

**Emergency Info:**
- [ ] Save pediatrician info
- [ ] Save emergency contacts
- [ ] Data persists after logout
- [ ] Child name appears in payloads

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Authors

- **Sameer** - [@sdsameer16](https://github.com/sdsameer16)

---

## 🙏 Acknowledgments

- React team for excellent documentation
- Socket.io for real-time capabilities
- SimplePeer for WebRTC simplification
- MongoDB team for flexible database
- Render & Netlify for hosting

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact: kinderkare@support.ac.in

---

## 🗺️ Roadmap

- [ ] Add multiple camera support
- [ ] Implement recording functionality
- [ ] Add admin panel for user management
- [ ] Mobile native apps (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Push notifications
- [ ] Screen sharing for caretakers

---

## 📊 System Requirements

**Minimum:**
- 2GB RAM
- 1.5 GHz processor
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection (3 Mbps+)

**Recommended:**
- 4GB+ RAM
- 2+ GHz processor
- Latest browser version
- High-speed internet (10 Mbps+)

---

**Made with ❤️ for parents and babies**

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
