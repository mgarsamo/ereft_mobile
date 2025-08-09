import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize axios with base URL
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add token to requests if available
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Check for stored token on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function - now uses real backend authentication
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      
      // Use real API login
      const response = await api.post('/api/auth/login/', {
        username,
        password,
      });

      const { token: authToken, user: userData } = response.data;
      
      // Store token and user data
      await AsyncStorage.setItem('authToken', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password. Please check your credentials and try again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Account access denied. Please contact support.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again in a few minutes.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid login information. Please check your input.';
      } else if (!error.response) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/register/', userData);
      
      const { token: authToken, user: newUser } = response.data;
      
      // Store token and user data
      await AsyncStorage.setItem('authToken', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(authToken);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.username?.[0] || 
               error.response?.data?.email?.[0] || 
               'Registration failed',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout endpoint if we have a real token
      if (token && !token.includes('mock') && !token.includes('google_token') && !token.includes('facebook_token')) {
        try {
          await api.post('/api/auth/logout/');
        } catch (error) {
          console.log('Logout endpoint error (non-critical):', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage and state, regardless of API call success
      try {
        await AsyncStorage.multiRemove(['authToken', 'user']);
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
      
      // Reset state
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      const response = await api.put('/api/profile/', profileData);
      
      const updatedUser = { ...user, ...response.data };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'Failed to update profile',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Get user profile
  const getProfile = async () => {
    try {
      const response = await api.get('/api/profile/');
      const updatedUser = { ...user, ...response.data };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  };

  // Get user stats for profile dashboard
  const getUserStats = async () => {
    try {
      const response = await api.get('/api/users/me/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Return default stats if API fails
      return {
        total_listings: 0,
        active_listings: 0,
        pending_review: 0,
        favorites_count: 0,
        views_total: 0,
        messages_unread: 0,
        properties_sold: 0,
        recent_views: 0,
      };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    getProfile,
    getUserStats,
    api,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
