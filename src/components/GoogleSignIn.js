import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        
        if (code && state) {
          console.log('🔐 GoogleSignIn: Authorization code received via deep link');
          console.log('🔐 GoogleSignIn: Code:', code ? 'YES' : 'NO');
          console.log('🔐 GoogleSignIn: State:', state ? 'YES' : 'NO');
          
          // Complete the OAuth flow
          completeOAuthFlow(code, state);
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
      
      console.log('🔐 GoogleSignIn: Client ID:', clientId);
      console.log('🔐 GoogleSignIn: Redirect URI:', redirectUri);
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
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        {
          showInRecents: true,
          createTask: false
        }
      );

      console.log('🔐 GoogleSignIn: WebBrowser result:', result);

      if (result.type === 'success') {
        console.log('🔐 GoogleSignIn: OAuth successful, processing result');
        console.log('🔐 GoogleSignIn: Result URL:', result.url);
        
        // Parse the URL to extract the authorization code
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        
        console.log('🔐 GoogleSignIn: Extracted code:', code ? 'YES' : 'NO');
        console.log('🔐 GoogleSignIn: Extracted state:', returnedState ? 'YES' : 'NO');
        
        // Verify state for security
        if (state !== returnedState) {
          throw new Error('OAuth state mismatch - potential security issue');
        }

        if (code) {
          console.log('🔐 GoogleSignIn: Authorization code received, completing OAuth flow');
          await completeOAuthFlow(code, returnedState);
        } else {
          console.error('🔐 GoogleSignIn: No code in URL:', result.url);
          throw new Error('No authorization code received from Google');
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