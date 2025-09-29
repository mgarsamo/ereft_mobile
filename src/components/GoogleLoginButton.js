import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ENV } from '../config/env';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

const GoogleLoginButton = ({ onSuccess, onError, style, textStyle }) => {
  const handleGoogleLogin = async () => {
    try {
      console.log('🔐 GoogleLoginButton: Starting Google OAuth flow');
      
      // Use Web Client ID from Google Cloud Console
      const clientId = ENV.GOOGLE_WEB_CLIENT_ID;
      
      // Create redirect URI - use custom deep link scheme
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'ereft',
        path: 'auth',
        useProxy: __DEV__, // Use proxy in development, direct in production
      });
      
      console.log('🔐 GoogleLoginButton: Client ID:', clientId);
      console.log('🔐 GoogleLoginButton: Redirect URI:', redirectUri);
      
      // Create the authorization request
      const authRequest = new AuthSession.AuthRequest({
        clientId: clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      });
      
      console.log('🔐 GoogleLoginButton: Starting OAuth flow with WebBrowser');
      
      // Use WebBrowser to start the OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(
        authRequest.url,
        redirectUri,
        {
          showInRecents: true,
        }
      );
      
      console.log('🔐 GoogleLoginButton: OAuth result:', result);
      
      if (result.type === 'success') {
        const { url } = result;
        console.log('🔐 GoogleLoginButton: OAuth success URL:', url);
        
        // Parse the URL to extract the authorization code
        const parsedUrl = new URL(url);
        const code = parsedUrl.searchParams.get('code');
        const error = parsedUrl.searchParams.get('error');
        
        if (error) {
          console.error('🔐 GoogleLoginButton: OAuth error from URL:', error);
          onError?.(error);
          return;
        }
        
        if (code) {
          console.log('🔐 GoogleLoginButton: Authorization code received, sending to backend');
          // Send the authorization code to our backend for processing
          await exchangeCodeForToken(code, redirectUri);
        } else {
          console.error('🔐 GoogleLoginButton: No authorization code in OAuth result');
          onError?.('No authorization code received from Google');
        }
      } else if (result.type === 'cancel') {
        console.log('🔐 GoogleLoginButton: User cancelled OAuth flow');
        onError?.('Sign-in cancelled');
      } else if (result.type === 'error') {
        console.error('🔐 GoogleLoginButton: OAuth error:', result.error);
        onError?.(result.error?.message || 'OAuth error occurred');
      } else {
        console.error('🔐 GoogleLoginButton: Unexpected result type:', result.type);
        onError?.('Unexpected OAuth result');
      }
      
    } catch (error) {
      console.error('🔐 GoogleLoginButton: Error during Google login:', error);
      onError?.(error.message || 'Google login failed');
    }
  };
  
  // Exchange authorization code for JWT token
  const exchangeCodeForToken = async (code, redirectUri) => {
    try {
      console.log('🔐 GoogleLoginButton: Exchanging code for token...');
      
      const response = await fetch(`${ENV.API_BASE_URL}/api/listings/oauth/callback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirect_uri: redirectUri,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔐 GoogleLoginButton: Token exchange successful');
        
        // Call onSuccess with the JWT token and user data
        onSuccess?.({
          token: data.access_token || data.token,
          refreshToken: data.refresh_token,
          user: data.user,
        });
      } else {
        const errorData = await response.json();
        console.error('🔐 GoogleLoginButton: Token exchange failed:', errorData);
        onError?.(errorData.error || 'Failed to exchange code for token');
      }
    } catch (error) {
      console.error('🔐 GoogleLoginButton: Error exchanging code for token:', error);
      onError?.('Failed to exchange authorization code');
    }
  };
  
  return (
    <TouchableOpacity style={[styles.googleButton, style]} onPress={handleGoogleLogin}>
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
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 8,
    shadowColor: '#4285F4',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default GoogleLoginButton;