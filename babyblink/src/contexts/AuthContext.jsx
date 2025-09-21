import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const backendUrl = "http://localhost:5000/api/auth";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem("authToken"); // Use consistent key
    const userData = localStorage.getItem("user");
    
    if (token) {
      setIsAuthenticated(true);
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error("Error parsing user data:", error);
          localStorage.removeItem("user");
        }
      }
    }
    setLoading(false);
  }, []);

  // 1️⃣ Register
  const register = async (form) => {
    try {
      const res = await fetch(`${backendUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      return { success: res.ok, data, error: data.error };
    } catch (err) {
      console.error("Register error:", err);
      return { success: false, error: "Network error. Please check your connection." };
    }
  };

  // 2️⃣ Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      const res = await fetch(`${backendUrl}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      return { success: res.ok, data, error: data.error };
    } catch (err) {
      console.error("Verify OTP error:", err);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // 3️⃣ Resend OTP
  const resendOTP = async (email) => {
    try {
      const res = await fetch(`${backendUrl}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return { success: res.ok, data, error: data.error };
    } catch (err) {
      console.error("Resend OTP error:", err);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // 4️⃣ Login - Enhanced with better error handling
  const login = async ({ username, password }) => {
    try {
      console.log("AuthContext: Attempting login for:", username);
      
      const res = await fetch(`${backendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      console.log("AuthContext: Response status:", res.status);
      
      const data = await res.json();
      console.log("AuthContext: Response data:", data);
      
      if (res.ok && data.token) {
        // Login successful
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsAuthenticated(true);
        setUser(data.user);
        
        return { 
          success: true, 
          data: {
            ...data,
            message: data.message || "Login successful"
          }
        };
      } else {
        // Login failed - return detailed error info
        return { 
          success: false, 
          data: {
            needsVerification: data.needsVerification,
            email: data.email
          },
          error: data.error || "Login failed"
        };
      }
      
    } catch (err) {
      console.error("AuthContext Login error:", err);
      return { 
        success: false, 
        error: "Network error. Please check your connection." 
      };
    }
  };

  // 5️⃣ Logout
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  // 6️⃣ Get current user info (if needed)
  const getCurrentUser = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;

    try {
      const res = await fetch(`${backendUrl}/me`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return userData;
      } else {
        // Token might be expired
        logout();
        return null;
      }
    } catch (err) {
      console.error("Get current user error:", err);
      return null;
    }
  };

  // 7️⃣ Forgot Password
  const forgotPassword = async (email) => {
    try {
      const res = await fetch(`${backendUrl}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return { success: res.ok, data, error: data.error };
    } catch (err) {
      console.error("Forgot password error:", err);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // 8️⃣ Reset Password
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await fetch(`${backendUrl}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      return { success: res.ok, data, error: data.error };
    } catch (err) {
      console.error("Reset password error:", err);
      return { success: false, error: "Network error. Please try again." };
    }
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
    getCurrentUser,
    forgotPassword,
    resetPassword
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