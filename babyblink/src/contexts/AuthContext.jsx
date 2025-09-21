import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    const storedToken = localStorage.getItem('babyblink_token');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('babyblink_token');
      const storedUser = localStorage.getItem('babyblink_user');
      
      if (storedToken && storedUser) {
        try {
          // Verify token with backend
          const response = await axios.get('http://localhost:5000/api/auth/profile');
          setUser(response.data.user);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('babyblink_token');
          localStorage.removeItem('babyblink_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', credentials);
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem('babyblink_token', newToken);
      localStorage.setItem('babyblink_user', JSON.stringify(userData));
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'OTP verification failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      setUser(null);
      setToken(null);
      localStorage.removeItem('babyblink_token');
      localStorage.removeItem('babyblink_user');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    verifyOTP,
    logout,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
