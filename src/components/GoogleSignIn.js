import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

const GoogleSignIn = ({ onSuccess, onError, style, textStyle }) => {
  const { loginWithGoogle } = useAuth();

  const getGoogleClientId = () => {
    if (Platform.OS === 'ios') {
      return ENV.GOOGLE_IOS_CLIENT_ID;
    } else if (Platform.OS === 'android') {
      return ENV.GOOGLE_ANDROID_CLIENT_ID;
    } else {
      return ENV.GOOGLE_WEB_CLIENT_ID;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 GoogleSignIn: Starting Google OAuth flow');
      
      // Generate state for security
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Configure OAuth request
      const clientId = getGoogleClientId();
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'ereft',
        path: 'oauth',
        projectNameForProxy: 'ereft'
      });

      console.log('🔐 GoogleSignIn: Client ID:', clientId);
      console.log('🔐 GoogleSignIn: Redirect URI:', redirectUri);

      // Create OAuth request
      const request = new AuthSession.AuthRequest({
        clientId: clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: redirectUri,
        responseType: AuthSession.ResponseType.Code,
        state: state,
        extraParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      });

      // Get authorization URL
      const authUrl = await request.makeAuthUrlAsync();
      console.log('🔐 GoogleSignIn: Auth URL generated');

      // Present OAuth flow
      const result = await request.promptAsync({
        authUrl: authUrl,
        useProxy: true,
        showInRecents: true
      });

      if (result.type === 'success') {
        console.log('🔐 GoogleSignIn: OAuth successful, processing result');
        
        // Extract authorization code
        const { code, state: returnedState } = result.params;
        
        // Verify state for security
        if (state !== returnedState) {
          throw new Error('OAuth state mismatch - potential security issue');
        }

        if (code) {
          console.log('🔐 GoogleSignIn: Authorization code received, calling backend');
          
          // Call backend to exchange code for tokens and user info
          const result = await loginWithGoogle(code);
          
          if (result.success) {
            console.log('🔐 GoogleSignIn: Backend authentication successful');
            onSuccess?.(result);
          } else {
            console.error('🔐 GoogleSignIn: Backend authentication failed:', result.message);
            onError?.(result.message);
          }
        } else {
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
      <Icon name="google" size={20} color="#FFFFFF" />
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