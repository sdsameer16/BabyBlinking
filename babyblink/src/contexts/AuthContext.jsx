import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Prefer Vite env var, allow optional window override for dynamic configs, fallback to localhost:5000
  const backendUrl =
    (typeof window !== 'undefined' && window.__API_BASE__) ||
    (import.meta && import.meta.env && import.meta.env.VITE_API_URL) ||
    `http://localhost:${(import.meta && import.meta.env && import.meta.env.VITE_API_PORT) || 5000}/api`;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      // Start periodic block checking
      startPeriodicBlockCheck();
    }
    setLoading(false);
  }, []);

  // 🚫 PERIODIC BLOCK CHECK - Check every 30 seconds if user is blocked
  const startPeriodicBlockCheck = () => {
    const blockCheckInterval = setInterval(async () => {
      const token = localStorage.getItem("token");
      if (!token || !isAuthenticated) {
        clearInterval(blockCheckInterval);
        return;
      }

      try {
        console.log("🔍 Checking user block status...");
        const result = await protectedApiRequest('/user/profile');
        
        if (!result.success && result.blocked) {
          console.log("🚫 User is blocked, forcing logout");
          clearInterval(blockCheckInterval);
          logout();
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("❌ Block check error:", error);
      }
    }, 30000); // Check every 30 seconds

    // Store interval ID to clear it on logout
    window.blockCheckInterval = blockCheckInterval;
  };

  // Helper function for API requests with detailed logging
  const apiRequest = async (endpoint, options = {}) => {
    try {
      console.log(`🌐 API Request to: ${backendUrl}${endpoint}`);
      console.log("📤 Request options:", {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.parse(options.body) : null
      });

      const response = await fetch(`${backendUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      console.log(`📥 Response status: ${response.status} ${response.statusText}`);

      let data;
      try {
        data = await response.json();
        console.log("📄 Response data:", data);
      } catch (jsonError) {
        console.error("❌ Failed to parse JSON response:", jsonError);
        data = { error: "Invalid response from server" };
      }

      // 🚫 AUTO-LOGOUT BLOCKED USERS
      if (response.status === 403 && data.blocked) {
        console.log("🚫 User account blocked, logging out automatically");
        
        // Show detailed blocked message before logout
        const supportEmail = data.supportEmail || 'kinderkare@support.ac.in';
        const blockedDate = data.blockedAt ? new Date(data.blockedAt).toLocaleDateString() : 'recently';
        
        alert(`🚫 Account Blocked by Admin\n\nReason: ${data.reason}\nBlocked on: ${blockedDate}\n\nFor further information please contact:\n📧 ${supportEmail}`);
        
        logout();
        window.location.href = "/login";
        return { 
          success: false, 
          data, 
          error: data.error,
          status: response.status,
          blocked: true
        };
      }

      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data);
      }

      return { 
        success: response.ok, 
        data, 
        error: response.ok ? null : data.error,
        status: response.status
      };

    } catch (err) {
      console.error("❌ Network/Fetch error:", err);
      return { 
        success: false, 
        error: "Network error. Please check your connection.",
        details: err.message
      };
    }
  };

  // Protected API request for authenticated routes
  const protectedApiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      return { success: false, error: "No authentication token found", requiresAuth: true };
    }

    return await apiRequest(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });
  };

  // 1️⃣ Register
  const register = async (form) => {
    console.log("📝 Starting registration process...");
    console.log("📋 Form data received:", form);

    // Validate required fields on frontend
    if (!form.username || !form.email || !form.password) {
      const error = "Username, email, and password are required";
      console.error("❌ Validation failed:", error);
      return { success: false, error };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      const error = "Please enter a valid email address";
      console.error("❌ Email validation failed:", error);
      return { success: false, error };
    }

    // Password validation
    if (form.password.length < 6) {
      const error = "Password must be at least 6 characters long";
      console.error("❌ Password validation failed:", error);
      return { success: false, error };
    }

    // Clean up form data (remove empty strings)
    const cleanedForm = {};
    Object.keys(form).forEach(key => {
      const value = form[key];
      if (value !== "" && value !== null && value !== undefined) {
        cleanedForm[key] = value;
      }
    });

    console.log("🧹 Cleaned form data:", cleanedForm);

    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(cleanedForm)
    });
  };

  // 2️⃣ Verify OTP
  const verifyOTP = async (email, otp) => {
    console.log("🔍 Starting OTP verification...");
    console.log("📧 Email:", email);
    console.log("🔢 OTP:", otp);

    if (!email || !otp) {
      const error = "Email and OTP are required";
      console.error("❌ OTP validation failed:", error);
      return { success: false, error };
    }

    if (otp.length !== 6) {
      const error = "OTP must be 6 digits";
      console.error("❌ OTP length validation failed:", error);
      return { success: false, error };
    }

    return await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
  };

  // 3️⃣ Resend OTP
  const resendOTP = async (email) => {
    console.log("🔄 Resending OTP to:", email);

    if (!email) {
      const error = "Email is required";
      console.error("❌ Email validation failed:", error);
      return { success: false, error };
    }

    return await apiRequest('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  // 4️⃣ Login
  const login = async ({ username, password }) => {
    console.log("🔐 Starting login process...");
    console.log("👤 Username:", username);

    if (!username || !password) {
      const error = "Username and password are required";
      console.error("❌ Login validation failed:", error);
      return { success: false, error };
    }

    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (result.success && result.data.token) {
      console.log("✅ Login successful, storing token");
      localStorage.setItem("token", result.data.token);
      setIsAuthenticated(true);
      setUser(result.data.user);
      
      // Start periodic block checking after successful login
      startPeriodicBlockCheck();
    }

    return result;
  };

  // 5️⃣ Logout
  const logout = () => {
    console.log("🚪 Logging out...");
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    
    // Clear block check interval
    if (window.blockCheckInterval) {
      clearInterval(window.blockCheckInterval);
      window.blockCheckInterval = null;
    }
  };

  // 6️⃣ Test connection
  const testConnection = async () => {
    console.log("🧪 Testing backend connection...");
    return await apiRequest('/health');
  };

  // 7️⃣ Test email
  const testEmail = async () => {
    console.log("📧 Testing email configuration...");
    return await apiRequest('/auth/test-email', {
      method: 'POST'
    });
  };

  const value = {
    // Auth state
    isAuthenticated,
    user,
    loading,
    
    // Auth methods
    register,
    verifyOTP,
    resendOTP,
    login,
    logout,
    
    // Debug methods
    testConnection,
    testEmail,
    apiRequest,
    protectedApiRequest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
