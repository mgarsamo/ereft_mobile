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

  // Handle deep linking for OAuth completion
  useEffect(() => {
    const handleDeepLink = (event) => {
      console.log('🔐 GoogleSignIn: Deep link received:', event.url);
      
      try {
        const url = new URL(event.url);
        // Listen for ereft://oauth deep link with authentication data
        if (url.protocol === 'ereft:' && url.pathname === '//oauth') {
          const token = url.searchParams.get('token');
          const userId = url.searchParams.get('user_id');
          const email = url.searchParams.get('email');
          const firstName = url.searchParams.get('first_name');
          const lastName = url.searchParams.get('last_name');
          const googleId = url.searchParams.get('google_id');
          const error = url.searchParams.get('error');
          
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
        }
      } catch (error) {
        console.error('🔐 GoogleSignIn: Deep link parsing error:', error);
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription?.remove();
    };
  }, []);

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

  // Complete OAuth flow with authentication data (token, user info)
  const completeOAuthFlowWithToken = async (token, userId, email, firstName, lastName, googleId) => {
    try {
      console.log('🔐 GoogleSignIn: Completing OAuth flow with authentication data');
      console.log('🔐 GoogleSignIn: Real user data received:', { userId, email, firstName, lastName, googleId });
      
      // Use the AuthContext function to complete the OAuth flow
      const { completeGoogleOAuth } = useAuth();
      
      if (completeGoogleOAuth) {
        const result = await completeGoogleOAuth(token, userId, email, firstName, lastName, googleId);
        
        if (result.success) {
          console.log('🔐 GoogleSignIn: OAuth completed successfully with real user data');
          onSuccess?.(result);
        } else {
          console.error('🔐 GoogleSignIn: OAuth completion failed:', result.message);
          onError?.(result.message);
        }
      } else {
        throw new Error('completeGoogleOAuth function not available in AuthContext');
      }
      
    } catch (error) {
      console.error('🔐 GoogleSignIn: Error completing OAuth flow with token:', error);
      onError?.(error.message || 'OAuth completion failed with token');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 GoogleSignIn: Starting production-ready OAuth flow');
      
      // Generate state for security
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Use web client ID for OAuth
      const clientId = ENV.GOOGLE_WEB_CLIENT_ID;
      
      // Use the HTTPS redirect URI that Google accepts
      const redirectUri = 'https://ereft.onrender.com/oauth';
      
      // For WebBrowser to work properly, we need to use the SAME redirect URI
      // that Google will redirect to, not a different success URL
      const webBrowserRedirectUri = 'https://ereft.onrender.com/oauth';
      
      console.log('🔐 GoogleSignIn: Client ID:', clientId);
      console.log('🔐 GoogleSignIn: Redirect URI:', redirectUri);
      console.log('🔐 GoogleSignIn: WebBrowser Redirect URI:', webBrowserRedirectUri);
      console.log('🔐 GoogleSignIn: Development mode:', __DEV__);

      // Build the Google OAuth URL manually for maximum control
      const googleOAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleOAuthUrl.searchParams.append('client_id', clientId);
      googleOAuthUrl.searchParams.append('redirect_uri', redirectUri);
      googleOAuthUrl.searchParams.append('response_type', 'code');
      googleOAuthUrl.searchParams.append('scope', 'openid profile email');
      googleOAuthUrl.searchParams.append('state', state);
      googleOAuthUrl.searchParams.append('access_type', 'offline');
      googleOAuthUrl.searchParams.append('prompt', 'consent');

      const authUrl = googleOAuthUrl.toString();
      console.log('🔐 GoogleSignIn: Auth URL generated');

      // Open the OAuth URL in a web browser
      // Use the SAME redirect URI that Google will redirect to
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        webBrowserRedirectUri,  // Use the same redirect URI for WebBrowser
        {
          showInRecents: true,
          createTask: false
        }
      );

      console.log('🔐 GoogleSignIn: WebBrowser result:', result);

      if (result.type === 'success') {
        console.log('🔐 GoogleSignIn: OAuth successful, processing result');
        console.log('🔐 GoogleSignIn: Result URL:', result.url);
        
        // The backend now redirects to ereft://oauth deep link
        // The deep link listener will handle the authorization code
        // We just need to wait for the deep link to be processed
        console.log('🔐 GoogleSignIn: Waiting for deep link with authorization code...');
        
        // The deep link listener will automatically call completeOAuthFlow
        // when it receives the ereft://oauth deep link
        
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