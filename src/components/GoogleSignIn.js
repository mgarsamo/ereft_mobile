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
      
      // Store authentication data in format expected by AuthContext
      await AsyncStorage.setItem('authToken', token);
      
      // Store user data in the format expected by AuthContext
      const userData = {
        id: parseInt(userId),
        username: `google_${userId}`,
        email: email,
        first_name: firstName || '',
        last_name: lastName || '',
        profile_picture: null,
        provider: 'google',
        google_id: googleId
      };
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
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
      
      // Use web client ID since Google only allows HTTPS redirects
      const clientId = ENV.GOOGLE_WEB_CLIENT_ID;
      
      // Use the redirect URI that's already configured in Google Cloud Console
      const redirectUri = 'https://ereft.onrender.com/oauth';
      
      // For WebBrowser to work properly, we need to use the SAME redirect URI
      // that Google will redirect to, not a different success URL
      const webBrowserRedirectUri = 'https://ereft.onrender.com/oauth';
      
      console.log('🔐 GoogleSignIn: Client ID:', clientId);
      console.log('🔐 GoogleSignIn: Redirect URI:', redirectUri);
      console.log('🔐 GoogleSignIn: WebBrowser Redirect URI:', webBrowserRedirectUri);
      
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