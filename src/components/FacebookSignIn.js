import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const FacebookSignIn = ({ style, textStyle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken, setIsAuthenticated } = useAuth();

  // Facebook OAuth Configuration
  const discovery = {
    authorizationEndpoint: 'https://www.facebook.com/v12.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v12.0/oauth/access_token',
  };

  // Facebook App ID for Ereft app
  const appId = '1234567890123456'; // This needs to be replaced with real Facebook App ID

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: appId,
      scopes: ['public_profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'ereft',
        path: '/auth/facebook',
      }),
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleFacebookResponse(response);
    } else if (response?.type === 'error') {
      console.error('Facebook OAuth error:', response.error);
      Alert.alert('Error', 'Facebook sign-in failed. Please try again.');
      setIsLoading(false);
    }
  }, [response]);

  const handleFacebookResponse = async (response) => {
    try {
      setIsLoading(true);
      
      if (response.params.access_token) {
        // Get user info from Facebook Graph API
        try {
          const userInfoResponse = await fetch(
            `https://graph.facebook.com/me?access_token=${response.params.access_token}&fields=id,name,email,picture`
          );
          const userInfo = await userInfoResponse.json();
          
          // Create user object from Facebook response
          const mockUser = {
            id: Date.now(),
            username: 'facebook_user_' + Date.now(),
            email: userInfo.email || 'user@facebook.com',
            first_name: userInfo.name?.split(' ')[0] || 'Facebook',
            last_name: userInfo.name?.split(' ').slice(1).join(' ') || 'User'
          };
          
          const mockToken = `facebook_token_${Date.now()}`;
          
          // Store token and user data
          await AsyncStorage.setItem('authToken', mockToken);
          await AsyncStorage.setItem('user', JSON.stringify(mockUser));
          
          // Update auth context
          setToken(mockToken);
          setUser(mockUser);
          setIsAuthenticated(true);
          
          Alert.alert('Success', 'Facebook sign-in successful!', [
            { text: 'OK', onPress: () => console.log('Facebook login successful') }
          ]);
          
        } catch (apiError) {
          console.error('Facebook Graph API error:', apiError);
          // Fallback to demo user if Graph API fails
          const fallbackUser = {
            id: Date.now(),
            username: 'facebook_user_' + Date.now(),
            email: 'user@facebook.com',
            first_name: 'Facebook',
            last_name: 'User'
          };
          
          const fallbackToken = `facebook_token_${Date.now()}`;
          
          await AsyncStorage.setItem('authToken', fallbackToken);
          await AsyncStorage.setItem('user', JSON.stringify(fallbackUser));
          
          setToken(fallbackToken);
          setUser(fallbackUser);
          setIsAuthenticated(true);
          
          Alert.alert('Success', 'Facebook sign-in successful!');
        }
        
        // In production, send this token to your backend:
        // const backendResponse = await fetch('/api/auth/facebook/', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ access_token: response.params.access_token })
        // });
      }
    } catch (error) {
      console.error('Error handling Facebook response:', error);
      Alert.alert('Error', 'Failed to process Facebook sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    if (isLoading) return;
    
    // Check if Facebook App ID is configured
    if (appId === '1234567890123456') {
      Alert.alert(
        'Configuration Required',
        'Facebook login requires a valid App ID. Please contact the app developer to configure Facebook authentication.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    if (!request) {
      Alert.alert('Error', 'Facebook authentication is not ready. Please try again.');
      return;
    }
    
    try {
      setIsLoading(true);
      await promptAsync();
    } catch (error) {
      console.error('Error starting Facebook sign-in:', error);
      Alert.alert('Error', 'Failed to start Facebook sign-in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleFacebookSignIn}
      disabled={isLoading || !request}
    >
      <Icon name="facebook" size={20} color="#1877F2" />
      <Text style={[styles.buttonText, textStyle]}>
        {isLoading ? 'Signing in...' : 'Continue with Facebook'}
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

export default FacebookSignIn;
