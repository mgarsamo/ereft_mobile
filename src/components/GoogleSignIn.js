import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

const GoogleSignIn = ({ onSuccess, onError, style, textStyle }) => {
  const { loginWithGoogle } = useAuth();

  // Complete OAuth flow with authentication token from deep link
  const completeOAuthFlowWithToken = async (token, userId, email, firstName, lastName, googleId) => {
    try {
      console.log('🔐 GoogleSignIn: Completing OAuth flow with token from deep link');
      console.log('🔐 GoogleSignIn: Token:', token ? 'YES' : 'NO');
      console.log('🔐 GoogleSignIn: User ID:', userId);
      console.log('🔐 GoogleSignIn: Email:', email);
      
      // Store authentication data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userId', userId.toString());
      await AsyncStorage.setItem('userEmail', email);
      
      // Call onSuccess with user data
      onSuccess?.({
        success: true,
        token,
        user: {
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          google_id: googleId
        }
      });
      
    } catch (error) {
      console.error('🔐 GoogleSignIn: Error completing OAuth flow with token:', error);
      onError?.('Failed to complete authentication');
    }
  };

  // Complete OAuth flow with authorization code
  const completeOAuthFlow = async (code, returnedState) => {
    try {
      console.log('🔐 GoogleSignIn: Completing OAuth flow with code');
      
      // Call backend to exchange code for tokens and user info
      const backendResult = await loginWithGoogle(code);
      
      if (backendResult.success) {
        console.log('🔐 GoogleSignIn: Backend authentication successful');
        onSuccess?.(backendResult);
      } else {
        console.error('🔐 GoogleSignIn: Backend authentication failed:', backendResult.message);
        onError?.(backendResult.message);
      }
    } catch (error) {
      console.error('🔐 GoogleSignIn: Error completing OAuth flow:', error);
      onError?.(error.message || 'OAuth completion failed');
    }
  };

  // Handle deep linking for OAuth completion
  const handleDeepLink = (event) => {
    console.log('🔐 GoogleSignIn: Deep link received:', event.url);
    
    try {
      const url = new URL(event.url);
      console.log('🔐 GoogleSignIn: Parsed URL:', {
        protocol: url.protocol,
        hostname: url.hostname,
        pathname: url.pathname,
        search: url.search
      });
      
      // Listen for ereft://oauth deep link with authentication data
      if (url.protocol === 'ereft:' && url.hostname === 'oauth') {
        console.log('🔐 GoogleSignIn: Valid ereft://oauth deep link detected');
        
        const token = url.searchParams.get('token');
        const userId = url.searchParams.get('user_id');
        const email = url.searchParams.get('email');
        const firstName = url.searchParams.get('first_name');
        const lastName = url.searchParams.get('last_name');
        const googleId = url.searchParams.get('google_id');
        const error = url.searchParams.get('error');
        
        console.log('🔐 GoogleSignIn: Deep link parameters:', {
          token: token ? 'YES' : 'NO',
          userId: userId ? 'YES' : 'NO',
          email: email ? 'YES' : 'NO',
          firstName: firstName ? 'YES' : 'NO',
          lastName: lastName ? 'YES' : 'NO',
          googleId: googleId ? 'YES' : 'NO',
          error: error || 'NO'
        });
        
        if (error) {
          console.error('🔐 GoogleSignIn: OAuth error from backend:', error);
          onError?.(error);
          return;
        }
        
        if (token && userId && email) {
          console.log('🔐 GoogleSignIn: Authentication data received via deep link');
          console.log('🔐 GoogleSignIn: Token:', token ? 'YES' : 'NO');
          console.log('🔐 GoogleSignIn: User ID:', userId);
          console.log('🔐 GoogleSignIn: Email:', email);
          
          // Complete the OAuth flow with the authentication data
          completeOAuthFlowWithToken(token, userId, email, firstName, lastName, googleId);
        } else {
          console.error('🔐 GoogleSignIn: Missing authentication data in deep link');
          onError?.('Authentication data incomplete');
        }
      } else {
        console.log('🔐 GoogleSignIn: Deep link ignored - not ereft://oauth');
      }
    } catch (error) {
      console.error('🔐 GoogleSignIn: Deep link parsing error:', error);
    }
  };

  // Set up deep link listener
  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 GoogleSignIn: Starting production-ready OAuth flow');
      
      // Generate state for security
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      // Build OAuth URL with proper parameters
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', ENV.GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', 'https://ereft.onrender.com/oauth/');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      
      console.log('🔐 GoogleSignIn: OAuth URL:', authUrl.toString());
      
      // Open OAuth in WebBrowser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        'ereft://oauth'
      );
      
      console.log('🔐 GoogleSignIn: WebBrowser result:', result);

      if (result.type === 'success') {
        console.log('🔐 GoogleSignIn: OAuth successful, processing result');
        console.log('🔐 GoogleSignIn: Result URL:', result.url);
        console.log('🔐 GoogleSignIn: Result type:', result.type);
        
        // The backend now redirects to ereft://oauth deep link
        // The deep link listener will handle the authorization code
        console.log('🔐 GoogleSignIn: Waiting for deep link with authentication data...');
        
        // Check if the result URL contains the deep link
        if (result.url && result.url.startsWith('ereft://')) {
          console.log('🔐 GoogleSignIn: Deep link detected in result URL!');
          // Manually trigger the deep link handler
          handleDeepLink({ url: result.url });
        } else {
          console.log('🔐 GoogleSignIn: No deep link in result URL, waiting for deep link listener...');
          console.log('🔐 GoogleSignIn: Expected: ereft://oauth?token=...&user_id=...&email=...');
          console.log('🔐 GoogleSignIn: Actual:', result.url);
          
          // FALLBACK: If no deep link in result URL, try to extract data from the HTML response
          try {
            console.log('🔐 GoogleSignIn: Attempting to extract auth data from HTML response...');
            
            // Make a request to the backend to get the current OAuth status
            const response = await fetch('https://ereft.onrender.com/oauth/');
            const htmlText = await response.text();
            
            // Look for authentication data in the HTML
            const tokenMatch = htmlText.match(/Authentication Token:\s*([a-f0-9]+)/);
            const userIdMatch = htmlText.match(/User ID:\s*(\d+)/);
            const emailMatch = htmlText.match(/Email:\s*([^\s<]+)/);
            
            if (tokenMatch && userIdMatch && emailMatch) {
              const token = tokenMatch[1];
              const userId = tokenMatch[1];
              const email = emailMatch[1];
              
              console.log('🔐 GoogleSignIn: Extracted auth data from HTML:', { token: token ? 'YES' : 'NO', userId, email });
              
              // Complete the OAuth flow with extracted data
              completeOAuthFlowWithToken(token, userId, email, '', '', '');
            } else {
              console.log('🔐 GoogleSignIn: Could not extract auth data from HTML');
              onError?.('Failed to extract authentication data from response');
            }
          } catch (fallbackError) {
            console.error('🔐 GoogleSignIn: Fallback extraction failed:', fallbackError);
            onError?.('Failed to complete OAuth flow - please try again');
          }
        }
        
      } else if (result.type === 'cancel') {
        console.log('🔐 GoogleSignIn: User cancelled OAuth flow');
        onError?.('Sign-in cancelled');
      } else if (result.type === 'error') {
        console.error('🔐 GoogleSignIn: OAuth error:', result.error);
        onError?.(result.error?.message || 'OAuth error occurred');
      }

    } catch (error) {
      console.error('🔐 GoogleSignIn: Error during Google sign-in:', error);
      const errorMessage = error.message || 'Google sign-in failed';
      onError?.(errorMessage);
      Alert.alert('Google Sign-In Error', errorMessage);
    }
  };

  return (
    <TouchableOpacity style={[styles.googleButton, style]} onPress={handleGoogleSignIn}>
      <Icon name="login" size={20} color="#FFFFFF" />
      <Text style={[styles.googleButtonText, textStyle]}>Continue with Google</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default GoogleSignIn;