import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
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

  // Add token to requests if available - Enhanced for JWT and legacy tokens
  api.interceptors.request.use(
    (config) => {
      // Use the current token from state (this will be updated when token changes)
      if (token) {
        // Check if it's a JWT token (Bearer) or legacy token
        if (token.includes('.') && token.length > 100) {
          // JWT token
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // Legacy token
          config.headers.Authorization = `Token ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for token refresh
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If we get a 401 and haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const refreshResult = await refreshAuthToken();
          if (refreshResult.success) {
            // Retry the original request with new token
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.log('🔐 AuthContext: Token refresh failed, redirecting to login');
        }
      }
      
      return Promise.reject(error);
    }
  );

  // Check authentication status - Production Ready
  const checkAuthStatus = async () => {
    try {
      console.log('🔐 AuthContext: Checking authentication status...');
      
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // For Google OAuth tokens, we trust them since they came from our backend
          // For regular tokens, we could verify with backend, but for now we'll trust them
          console.log('🔐 AuthContext: Token found, setting authentication state');
          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
          return true;
        } catch (parseError) {
          console.error('🔐 AuthContext: Error parsing stored user data:', parseError);
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('🔐 AuthContext: Check auth status error:', error);
      return false;
    }
  };

  // Initialize authentication state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 AuthContext: Initializing authentication system...');
        
        // Initialize demo users if needed
        await UserStorage.initializeDemoUsers();
        console.log('🔐 AuthContext: Demo users initialized');
        
        // Check if user is already logged in
        await checkAuthStatus();
        
      } catch (error) {
        console.error('🔐 AuthContext: Error initializing auth system:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Enhanced Login function with JWT authentication
  const login = async (username, password) => {
    try {
      console.log('🔐 AuthContext: Starting enhanced login process for:', username);
      setIsLoading(true);
      
      // Try enhanced JWT authentication first
      console.log('🔐 AuthContext: Attempting enhanced JWT authentication...');
      try {
        const response = await api.post('/api/listings/auth/login/', {
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
        
        console.log('🔐 AuthContext: Authentication successful for user:', userData.username);
        return { success: true };
      } catch (apiError) {
        console.log('🔐 AuthContext: Authentication failed:', apiError.message);
        
        // Only fall back to local if backend is completely unavailable (network error)
        // Do NOT fall back for authentication errors (401, 403, etc.)
        if (apiError.code === 'NETWORK_ERROR' || apiError.message === 'Network Error' || apiError.code === 'ECONNREFUSED') {
          console.log('🔐 AuthContext: Network error, trying local authentication as fallback...');
          const localUser = await UserStorage.authenticateUser(username, password);
          
          if (localUser) {
            console.log('🔐 AuthContext: Local authentication successful for user:', localUser.username);
            const authToken = UserStorage.generateAuthToken(localUser.id);
            
            // Store token and user data
            await AsyncStorage.setItem('authToken', authToken);
            await AsyncStorage.setItem('user', JSON.stringify(localUser));
            
            setToken(authToken);
            setUser(localUser);
            setIsAuthenticated(true);
            
            console.log('🔐 AuthContext: User logged in successfully via local fallback:', localUser.username);
            return { success: true };
          }
        }
        
        // If authentication fails, show helpful message
        let errorMessage = 'Invalid username or password.';
        
        if (apiError.response?.status === 401) {
          errorMessage = 'Invalid username or password. Make sure you\'ve registered an account.';
        } else if (apiError.response?.status === 404) {
          errorMessage = 'Authentication service not available. Please try again later.';
        } else if (apiError.code === 'NETWORK_ERROR' || apiError.message === 'Network Error') {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('🔐 AuthContext: Enhanced login error:', error);
      
      return {
        success: false,
        error: 'Login failed. Please check your credentials and try again.',
      };
    } finally {
      console.log('🔐 AuthContext: Setting loading to false');
      setIsLoading(false);
    }
  };

  // Enhanced Register function with email verification
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
      
      // Try enhanced backend registration with email verification first
      try {
        console.log('🔐 AuthContext: Attempting enhanced registration with email verification...');
        const response = await api.post('/api/auth/enhanced-register/', userData);
        
        // Enhanced registration returns message about email verification
        const { message, user_id, email } = response.data;
        
        console.log('🔐 AuthContext: Enhanced registration successful, email verification required');
        
        return { 
          success: true, 
          message: message,
          requiresVerification: true,
          userId: user_id,
          email: email
        };
      } catch (apiError) {
        console.log('🔐 AuthContext: Enhanced registration failed, trying legacy registration...');
        
        // Fall back to legacy registration
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
        } catch (legacyError) {
          console.log('🔐 AuthContext: Legacy registration failed, creating local account...');
          
          // If both backend methods fail, create a real local account
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
      }
    } catch (error) {
      console.error('🔐 AuthContext: Enhanced register error:', error);
      return {
        success: false,
        error: 'Registration failed. Please check your information and try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Email verification function
  const verifyEmail = async (token) => {
    try {
      console.log('🔐 AuthContext: Verifying email with token...');
      setIsLoading(true);
      
      const response = await api.post(`/api/auth/verify-email/${token}/`);
      
      const { access_token, refresh_token, user: userData, message } = response.data;
      
      // Store JWT tokens and user data
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('🔐 AuthContext: Email verification successful for user:', userData.username);
      return { success: true, message: message };
      
    } catch (error) {
      console.error('🔐 AuthContext: Email verification error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Email verification failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // SMS verification functions
  const sendSmsVerification = async (phone) => {
    try {
      console.log('🔐 AuthContext: Sending SMS verification to:', phone);
      setIsLoading(true);
      
      const response = await api.post('/api/auth/send-sms-verification/', { phone });
      
      console.log('🔐 AuthContext: SMS verification code sent successfully');
      return { success: true, message: response.data.message };
      
    } catch (error) {
      console.error('🔐 AuthContext: SMS verification error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to send SMS verification. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const verifySmsCode = async (phone, code) => {
    try {
      console.log('🔐 AuthContext: Verifying SMS code for phone:', phone);
      setIsLoading(true);
      
      const response = await api.post('/api/auth/verify-sms-code/', { phone, code });
      
      console.log('🔐 AuthContext: SMS verification successful');
      return { success: true, message: response.data.message };
      
    } catch (error) {
      console.error('🔐 AuthContext: SMS code verification error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'SMS verification failed. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Token refresh function
  const refreshAuthToken = async () => {
    try {
      console.log('🔐 AuthContext: Refreshing authentication token...');
      
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/api/auth/refresh-token/', {
        refresh_token: refreshToken
      });
      
      const { access_token, refresh_token } = response.data;
      
      // Store new tokens
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      
      setToken(access_token);
      
      console.log('🔐 AuthContext: Token refreshed successfully');
      return { success: true };
      
    } catch (error) {
      console.error('🔐 AuthContext: Token refresh error:', error);
      // If refresh fails, user needs to login again
      await logout();
      return { success: false, error: 'Session expired. Please login again.' };
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
          const response = await api.get('/api/listings/users/me/stats/');
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

  // Google Sign-In with Google Identity Services - Production Ready
  const loginWithGoogle = async (authorizationCode) => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Processing Google OAuth with authorization code');
      console.log('🔐 AuthContext: API Base URL:', API_BASE_URL);
      console.log('🔐 AuthContext: Authorization code received:', authorizationCode ? 'YES' : 'NO');
      
      // Step 1: Send authorization code to backend for processing
      console.log('🔐 AuthContext: Sending authorization code to backend...');
      
      const response = await api.post('/api/auth/google/', {
        code: authorizationCode,
        redirect_uri: 'https://ereft.onrender.com/oauth'
      });
      
      console.log('🔐 AuthContext: Backend response received:', response.status);
      
      if (response.data && response.data.token && response.data.user) {
        const { token: authToken, user: userData } = response.data;
        
        console.log('🔐 AuthContext: Backend authentication successful');
        console.log('🔐 AuthContext: User data from backend:', userData);
        
        // Step 2: Store real token and user data from backend
        await AsyncStorage.setItem('authToken', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Step 3: Update application state
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('🔐 Google OAuth successful - user signed in:', userData.username);
        
        return {
          success: true,
          message: 'Google sign-in successful!',
          user: userData,
          token: authToken
        };
        
      } else {
        console.error('🔐 AuthContext: Backend response missing required data');
        throw new Error('Backend authentication response incomplete');
      }
      
    } catch (error) {
      console.error('🔐 Google OAuth error:', error);
      
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (error.response) {
        // Backend error response
        console.error('🔐 Backend error status:', error.response.status);
        console.error('🔐 Backend error data:', error.response.data);
        errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Network error
        console.error('🔐 Network error:', error.request);
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        // Other error
        console.error('🔐 Other error:', error.message);
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

  // Complete Google OAuth with user data from backend
  const completeGoogleOAuth = async (token, userId, email, firstName, lastName, googleId) => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Completing Google OAuth with user data from backend');
      
      // Create user data object from the backend data
      const userData = {
        id: userId,
        username: `google_${email.split('@')[0]}`,
        email: email,
        first_name: firstName || '',
        last_name: lastName || '',
        provider: 'google',
        google_id: googleId
      };
      
      console.log('🔐 AuthContext: User data from backend:', userData);
      
      // Store token and user data locally
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('🔐 Google OAuth completed successfully with real user data');
      
      return {
        success: true,
        message: 'Google sign-in successful!',
        user: userData,
        token: token
      };
      
    } catch (error) {
      console.error('🔐 Google OAuth completion error:', error);
      return {
        success: false,
        message: error.message || 'Failed to complete Google sign-in',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset functionality
  const resetPassword = async (email) => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Resetting password for', email);
      
      // For now, we'll use a simple approach since we don't have email service configured
      // In production, this would send an email with reset link
      if (__DEV__) {
        // Development mode: just return success
        console.log('🔐 Development mode: Password reset would be sent to', email);
        return {
          success: true,
          message: 'Password reset link would be sent to your email (development mode)',
        };
      } else {
        // Production: call backend API
        const response = await api.post('/api/auth/reset-password/', { email });
        return response.data;
      }
    } catch (error) {
      console.error('🔐 Password reset error:', error);
      return {
        success: false,
        message: 'Failed to reset password. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Change password (for authenticated users)
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Changing password');
      
      // For now, we'll use a simple approach
      // In production, this would call the backend API
      if (__DEV__) {
        // Development mode: just return success
        console.log('🔐 Development mode: Password changed successfully');
        return {
          success: true,
          message: 'Password changed successfully (development mode)',
        };
      } else {
        // Production: call backend API
        const response = await api.post('/api/auth/change-password/', {
          current_password: currentPassword,
          new_password: newPassword,
        });
        return response.data;
      }
    } catch (error) {
      console.error('🔐 Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user account
  const deleteAccount = async (password) => {
    try {
      setIsLoading(true);
      console.log('🔐 AuthContext: Deleting user account');
      
      // For now, we'll use a simple approach
      // In production, this would call the backend API to delete the account
      if (__DEV__) {
        // Development mode: just clear local data
        console.log('🔐 Development mode: Account deletion simulated');
        
        // Clear all local data
        await AsyncStorage.clear();
        
        // Reset state
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        
        return {
          success: true,
          message: 'Account deleted successfully (development mode)',
        };
      } else {
        // Production: call backend API
        const response = await api.delete('/api/auth/delete-account/', {
          data: { password },
        });
        
        if (response.data.success) {
          // Clear local data
          await AsyncStorage.clear();
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
        
        return response.data;
      }
    } catch (error) {
      console.error('🔐 Delete account error:', error);
      return {
        success: false,
        message: 'Failed to delete account. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Deep link handling for OAuth redirects
  const handleDeepLink = async (url) => {
    try {
      console.log('🔐 AuthContext: Handling deep link:', url);
      
      if (url && url.includes('ereft://auth')) {
        const parsed = Linking.parse(url);
        console.log('🔐 AuthContext: Parsed deep link:', parsed);
        
        const { queryParams } = parsed;
        
        if (queryParams?.token) {
          console.log('🔐 AuthContext: JWT token received from deep link');
          
          // Store the JWT token
          await AsyncStorage.setItem('token', queryParams.token);
          
          // If user data is also provided in the deep link, store it
          if (queryParams.user_id) {
            const userData = {
              id: queryParams.user_id,
              email: queryParams.email || '',
              first_name: queryParams.first_name || '',
              last_name: queryParams.last_name || '',
              is_verified: queryParams.is_verified === 'true',
              profile_picture: queryParams.profile_picture || null,
            };
            
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
          }
          
          // Set authentication state
          setToken(queryParams.token);
          setIsAuthenticated(true);
          
          console.log('🔐 AuthContext: Successfully authenticated via deep link');
          
          // Optionally fetch full user profile from backend
          if (queryParams.user_id) {
            try {
              await getProfile();
            } catch (error) {
              console.log('🔐 AuthContext: Could not fetch full profile, using deep link data');
            }
          }
        } else {
          console.error('🔐 AuthContext: No token found in deep link');
        }
      }
    } catch (error) {
      console.error('🔐 AuthContext: Error handling deep link:', error);
    }
  };

  // Initialize deep link listener
  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('🔐 AuthContext: Initial URL:', initialUrl);
        await handleDeepLink(initialUrl);
      }
    };

    getInitialURL();

    // Listen for deep links while app is running
    const linkingListener = Linking.addEventListener('url', (event) => {
      console.log('🔐 AuthContext: Deep link received:', event.url);
      handleDeepLink(event.url);
    });

    return () => {
      linkingListener?.remove();
    };
  }, []);

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
    completeGoogleOAuth,
    resetPassword,
    changePassword,
    deleteAccount,
    checkAuthStatus,
    api,
    // Enhanced authentication functions
    verifyEmail,
    sendSmsVerification,
    verifySmsCode,
    refreshAuthToken,
    // Google OAuth success handler
    handleGoogleOAuthSuccess: async (oauthData) => {
      try {
        console.log('🔐 AuthContext: Handling Google OAuth success');
        
        if (oauthData.token) {
          // Store the JWT token
          await AsyncStorage.setItem('token', oauthData.token);
          setToken(oauthData.token);
          
          // Store user data if provided
          if (oauthData.user) {
            await AsyncStorage.setItem('user', JSON.stringify(oauthData.user));
            setUser(oauthData.user);
          }
          
          // Set authentication state
          setIsAuthenticated(true);
          
          console.log('🔐 AuthContext: Google OAuth authentication successful');
        }
      } catch (error) {
        console.error('🔐 AuthContext: Error handling Google OAuth success:', error);
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
