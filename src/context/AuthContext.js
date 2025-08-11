import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import UserStorage from '../services/UserStorage';
import SmsService from '../services/SmsService';

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
        // For all tokens, use Bearer format as it's more standard
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Check for stored token on app start and initialize user storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Initialize demo users if needed
        await UserStorage.initializeDemoUsers();
        
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

  // Login function - uses local user storage and backend
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      
      // First try to authenticate with locally stored users (including registered users)
      const localUser = await UserStorage.authenticateUser(username, password);
      
      if (localUser) {
        const authToken = UserStorage.generateAuthToken(localUser.id);
        
        // Store token and user data
        await AsyncStorage.setItem('authToken', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(localUser));
        
        setToken(authToken);
        setUser(localUser);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      // If no local user found, try real backend authentication
      try {
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
      } catch (apiError) {
        // If both local and backend fail, show helpful message
        let errorMessage = 'Invalid username or password.';
        
        if (apiError.code === 'NETWORK_ERROR' || apiError.message === 'Network Error') {
          errorMessage = 'Invalid username or password. If you haven\'t registered yet, please sign up first.';
        } else if (apiError.response?.status === 401) {
          errorMessage = 'Invalid username or password. Make sure you\'ve registered an account.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      return {
        success: false,
        error: 'Login failed. Please check your credentials and try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function - creates real persistent accounts
  const register = async (userData) => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        return {
          success: false,
          error: 'Please fill in all required fields.',
        };
      }

      // Check if user already exists locally
      const userExists = await UserStorage.userExists(userData.username, userData.email);
      if (userExists) {
        return {
          success: false,
          error: 'A user with this username or email already exists.',
        };
      }
      
      // Try real backend registration first
      try {
        const response = await api.post('/api/auth/register/', userData);
        
        const { token: authToken, user: newUser } = response.data;
        
        // Store token and user data
        await AsyncStorage.setItem('authToken', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
        
        setToken(authToken);
        setUser(newUser);
        setIsAuthenticated(true);
        
        return { success: true, message: 'Account created successfully!' };
      } catch (apiError) {
        // If backend fails, create a real local account
        console.log('Backend registration failed, creating local account...');
        
        try {
          const newUser = await UserStorage.saveUser(userData);
          const authToken = UserStorage.generateAuthToken(newUser.id);
          
          // Store token and user data
          await AsyncStorage.setItem('authToken', authToken);
          await AsyncStorage.setItem('user', JSON.stringify(newUser));
          
          setToken(authToken);
          setUser(newUser);
          setIsAuthenticated(true);
          
          return { success: true, message: 'Account created successfully! You can now login with your credentials.' };
        } catch (localError) {
          return {
            success: false,
            error: localError.message || 'Registration failed. Please try again.',
          };
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Registration failed. Please check your information and try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function - Enhanced for iPhone compatibility
  const logout = async () => {
    console.log('🔐 AuthContext: Starting logout process...');
    
    try {
      setIsLoading(true);
      
      // Call logout endpoint if we have a real token
      if (token && !token.includes('mock') && !token.includes('google_token') && !token.includes('facebook_token') && !token.includes('phone_token')) {
        try {
          console.log('🔐 Calling logout API...');
          await api.post('/api/auth/logout/');
          console.log('🔐 Logout API successful');
        } catch (error) {
          console.log('🔐 Logout endpoint error (non-critical):', error);
        }
      }
      
      console.log('🔐 Clearing local storage...');
      
      // Clear all auth-related storage items individually for better iPhone compatibility
      const keysToRemove = [
        'authToken',
        'user',
        'currentVerificationId',
        'pendingPhoneVerification',
        'google_token',
        'facebook_token',
      ];
      
      // Remove items one by one instead of multiRemove for iPhone compatibility
      for (const key of keysToRemove) {
        try {
          await AsyncStorage.removeItem(key);
          console.log(`🔐 Removed ${key} from storage`);
        } catch (storageError) {
          console.error(`🔐 Error removing ${key}:`, storageError);
        }
      }
      
      // Additional cleanup for verification data
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const verificationKeys = allKeys.filter(key => key.startsWith('verification_'));
        for (const key of verificationKeys) {
          await AsyncStorage.removeItem(key);
          console.log(`🔐 Removed verification key: ${key}`);
        }
      } catch (error) {
        console.error('🔐 Error cleaning verification keys:', error);
      }
      
    } catch (error) {
      console.error('🔐 Logout error:', error);
    } finally {
      // Always reset state, regardless of storage clearing success
      console.log('🔐 Resetting auth state...');
      
      // Use setTimeout to ensure state updates happen after any pending operations
      setTimeout(() => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        console.log('🔐 Logout complete - state reset');
      }, 100);
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
  // Send phone verification code
  const sendPhoneVerification = async (phoneNumber) => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Sending verification to', phoneNumber);
      
      const result = await SmsService.sendVerificationCode(phoneNumber);
      
      if (result.success) {
        // Store verification ID for later use
        await AsyncStorage.setItem('currentVerificationId', result.verificationId);
        
        // Show helpful message for test numbers
        if (result.isTestNumber) {
          console.log('📱 Test number - Code:', result.message);
        }
        
        if (result.fallbackCode && __DEV__) {
          console.log('📱 Development fallback code:', result.fallbackCode);
        }
      }
      
      return result;
    } catch (error) {
      console.error('🔐 Send verification error:', error);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Verify phone code and login
  const verifyPhoneCode = async (phoneNumber, code, verificationId = null) => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Verifying code for', phoneNumber);
      
      // Get verification ID from parameter or storage
      let currentVerificationId = verificationId;
      if (!currentVerificationId) {
        currentVerificationId = await AsyncStorage.getItem('currentVerificationId');
      }
      
      if (!currentVerificationId) {
        return {
          success: false,
          message: 'Verification session not found. Please request a new code.',
        };
      }
      
      // Verify with SMS service
      const verificationResult = await SmsService.verifyCode(currentVerificationId, code);
      
      if (verificationResult.success) {
        // Create user for phone authentication
        const phoneUser = {
          id: Date.now(),
          phone: phoneNumber,
          username: `user_${phoneNumber.slice(-4)}`,
          email: `${phoneNumber.replace(/[^0-9]/g, '')}@phone.local`,
          name: `Phone User ${phoneNumber.slice(-4)}`,
          profile_picture: null,
          provider: 'local',
        };
        
        const phoneToken = `phone_token_${Date.now()}`;
        
        // Store user and token
        await AsyncStorage.setItem('authToken', phoneToken);
        await AsyncStorage.setItem('user', JSON.stringify(phoneUser));
        await AsyncStorage.removeItem('currentVerificationId');
        
        // Update state
        setToken(phoneToken);
        setUser(phoneUser);
        setIsAuthenticated(true);
        
        // Save to local storage for persistence
        await UserStorage.saveUser({
          username: phoneUser.username,
          email: phoneUser.email,
          phone: phoneUser.phone,
          name: phoneUser.name,
          password: 'phone_auth',
        });
        
        console.log('🔐 Phone authentication successful for', phoneNumber);
        
        return {
          success: true,
          message: 'Phone number verified successfully!',
        };
      } else {
        return verificationResult;
      }
    } catch (error) {
      console.error('🔐 Phone verification error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification code
  const resendVerificationCode = async (phoneNumber) => {
    try {
      console.log('🔐 AuthContext: Resending code to', phoneNumber);
      
      // Get current verification ID
      const currentVerificationId = await AsyncStorage.getItem('currentVerificationId');
      
      if (!currentVerificationId) {
        // No active session, send new code
        return await sendPhoneVerification(phoneNumber);
      }
      
      // Use SMS service to resend
      const result = await SmsService.resendVerificationCode(currentVerificationId);
      
      if (result.success && result.newVerificationId) {
        // Update stored verification ID
        await AsyncStorage.setItem('currentVerificationId', result.newVerificationId);
      }
      
      return result;
    } catch (error) {
      console.error('🔐 Resend code error:', error);
      return {
        success: false,
        message: 'Failed to resend code. Please try again.',
      };
    }
  };

  const getUserStats = async () => {
    try {
      // Only try API if authenticated and have a backend token (not local ereft_token)
      if (isAuthenticated && token && !token.startsWith('ereft_token_')) {
        try {
          const response = await api.get('/api/users/me/stats/');
          if (response.data) {
            return response.data;
          }
        } catch (apiError) {
          console.error('API user stats failed:', apiError.message);
          // Fall back to local user data
        }
      }
      
      // Get real stats from local user data or return zeros
      if (user && user.id) {
        try {
          const localUser = await UserStorage.getUserById(user.id);
          if (localUser) {
            // Return real local user stats, not fake ones
            return {
              total_listings: localUser.total_listings || 0,
              active_listings: localUser.active_listings || 0,
              pending_review: localUser.pending_review || 0,
              favorites_count: localUser.favorites_count || 0,
              views_total: localUser.views_total || 0,
              messages_unread: localUser.messages_unread || 0,
              properties_sold: localUser.properties_sold || 0,
              recent_views: localUser.recent_views || 0,
            };
          }
        } catch (localError) {
          console.error('Error fetching local user stats:', localError);
        }
      }
      
      // Return zeros if no user data available (real, not fake)
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
    } catch (error) {
      console.error('Error in getUserStats:', error);
      // Return zeros instead of throwing
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

  // Google Sign-In with Google Identity Services
  const loginWithGoogle = async (authCode) => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Processing Google OAuth with code');
      
      // Call backend to exchange authorization code for tokens and user info
      const response = await api.post('/api/auth/google/', {
        code: authCode,
        redirect_uri: 'ereft://oauth' // Should match the redirect URI used in OAuth flow
      });

      if (response.data && response.data.token) {
        const { token: authToken, user: userData } = response.data;
        
        // Store token and user data
        await AsyncStorage.setItem('authToken', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('🔐 Google OAuth successful:', userData);
        
        return {
          success: true,
          message: 'Google sign-in successful!',
          user: userData,
          token: authToken
        };
      } else {
        throw new Error('Invalid response from backend');
      }
      
    } catch (error) {
      console.error('🔐 Google OAuth error:', error);
      
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (error.response) {
        // Backend error response
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        // Other error
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
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
    sendPhoneVerification,
    verifyPhoneCode,
    resendVerificationCode,
    loginWithGoogle,
    api,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
