import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';
import Icon from 'react-native-vector-icons/MaterialIcons';

const GoogleSignIn = ({ onSuccess, onError, style, textStyle }) => {
  const { loginWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 GoogleSignIn: Starting direct ID token flow');
      
      // Generate state for security
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Use web client ID for OAuth
      const clientId = ENV.GOOGLE_WEB_CLIENT_ID;
      
      // Create redirect URI that will work with Google
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'ereft',
        path: 'oauth'
      });

      console.log('🔐 GoogleSignIn: Client ID:', clientId);
      console.log('🔐 GoogleSignIn: Redirect URI:', redirectUri);

      // Create OAuth request for ID token
      const request = new AuthSession.AuthRequest({
        clientId: clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
        state: state,
        extraParams: {
          nonce: state // Use state as nonce for additional security
        }
      });

      console.log('🔐 GoogleSignIn: Auth request created successfully');

      // Present OAuth flow
      const result = await request.promptAsync({
        useProxy: false,
        showInRecents: true
      });

      console.log('🔐 GoogleSignIn: OAuth result:', result);

      if (result.type === 'success') {
        console.log('🔐 GoogleSignIn: OAuth successful, processing result');
        
        // Extract ID token and state
        const { id_token, state: returnedState } = result.params;
        
        console.log('🔐 GoogleSignIn: ID token received:', id_token ? 'YES' : 'NO');
        console.log('🔐 GoogleSignIn: State verification:', state === returnedState ? 'PASS' : 'FAIL');
        
        // Verify state for security
        if (state !== returnedState) {
          throw new Error('OAuth state mismatch - potential security issue');
        }

        if (id_token) {
          console.log('🔐 GoogleSignIn: ID token received, calling backend for verification');
          
          // Call backend to verify ID token and create user session
          const backendResult = await loginWithGoogle(id_token);
          
          if (backendResult.success) {
            console.log('🔐 GoogleSignIn: Backend verification successful');
            onSuccess?.(backendResult);
          } else {
            console.error('🔐 GoogleSignIn: Backend verification failed:', backendResult.message);
            onError?.(backendResult.message);
          }
        } else {
          throw new Error('No ID token received from Google');
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