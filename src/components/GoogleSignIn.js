import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const GoogleSignIn = ({ style, textStyle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken, setIsAuthenticated } = useAuth();

  // Google OAuth Configuration
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  // Google OAuth Client ID - should be replaced with actual project client ID
  const clientId = '260862382785-bkr2mukc06lo72p37dusc2vcc96v0aj2.apps.googleusercontent.com';

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'ereft',
        path: '/auth/google',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    } else if (response?.type === 'error') {
      console.error('Google OAuth error:', response.error);
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (response) => {
    try {
      setIsLoading(true);
      
      if (response.params.id_token) {
        // Decode the ID token to get user info (simplified for demo)
        const idToken = response.params.id_token;
        
        // Create user object from Google response
        const mockUser = {
          id: Date.now(),
          username: 'google_user_' + Date.now(),
          email: 'user@gmail.com',
          first_name: 'Google',
          last_name: 'User'
        };
        
        const mockToken = `google_token_${Date.now()}`;
        
        // Store token and user data
        await AsyncStorage.setItem('authToken', mockToken);
        await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        
        // Update auth context
        setToken(mockToken);
        setUser(mockUser);
        setIsAuthenticated(true);
        
        Alert.alert('Success', 'Google sign-in successful!', [
          { text: 'OK', onPress: () => console.log('Google login successful') }
        ]);
        
        // In production, send this token to your backend:
        // const backendResponse = await fetch('/api/auth/google/', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ id_token: idToken })
        // });
      }
    } catch (error) {
      console.error('Error handling Google response:', error);
      Alert.alert('Error', 'Failed to process Google sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    
    if (!request) {
      Alert.alert(
        'Authentication Error',
        'Google sign-in is not ready. Please check your internet connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await promptAsync();
      
      // The response will be handled by the useEffect hook
      if (result.type === 'cancel') {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error starting Google sign-in:', error);
      Alert.alert(
        'Authentication Error', 
        'Failed to start Google sign-in. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleGoogleSignIn}
      disabled={isLoading || !request}
    >
      <Icon name="login" size={20} color="#4285F4" />
      <Text style={[styles.buttonText, textStyle]}>
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  buttonText: {
    color: '#3C4043',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default GoogleSignIn;
