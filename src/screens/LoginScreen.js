import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import GoogleSignIn from '../components/GoogleSignIn';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/api';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, isLoading, sendPhoneVerification, checkAuthStatus } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginMethod, setLoginMethod] = useState('username'); // 'username' or 'phone'
  const [countryCode, setCountryCode] = useState('+251'); // Default to Ethiopia
  const [phoneNumber, setPhoneNumber] = useState('');

  const validatePhoneNumber = (phone, country) => {
    const cleanPhone = phone.replace(/\s|-|\(|\)/g, '');
    
    if (country === '+251') {
      // Ethiopian phone validation: +251XXXXXXXXX or 09XXXXXXXX or 07XXXXXXXX
      const ethiopianRegex = /^(\+251|0)?[79]\d{8}$/;
      return ethiopianRegex.test(cleanPhone);
    } else if (country === '+1') {
      // US phone validation: +1XXXXXXXXXX or (XXX) XXX-XXXX
      const usRegex = /^(\+1)?[2-9]\d{9}$/;
      return usRegex.test(cleanPhone);
    }
    return false;
  };

  const validateForm = () => {
    const newErrors = {};

    if (loginMethod === 'phone') {
      if (!phoneNumber.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!validatePhoneNumber(phoneNumber, countryCode)) {
        newErrors.phone = countryCode === '+251' 
          ? 'Please enter a valid Ethiopian phone number (09XXXXXXXX or 07XXXXXXXX)'
          : 'Please enter a valid US phone number';
      }
      
      // For phone login, we don't need password initially - we'll send verification code
    } else {
      if (!username.trim()) {
        newErrors.username = 'Username/Email is required';
      }

      if (!password.trim()) {
        newErrors.password = 'Password is required';
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      console.log('🔐 LoginScreen: Starting login process...');
      console.log('🔐 LoginScreen: Login method:', loginMethod);
      
      if (loginMethod === 'phone') {
        // Phone authentication - send verification code
        const fullPhoneNumber = formatPhoneNumber(phoneNumber, countryCode);
        console.log('🔐 LoginScreen: Sending phone verification to:', fullPhoneNumber);
        
        const result = await sendPhoneVerification(fullPhoneNumber);
        
        if (result.success) {
          console.log('🔐 LoginScreen: Phone verification sent successfully');
          // Navigate to verification screen
          navigation.navigate('PhoneVerification', {
            phoneNumber: fullPhoneNumber,
            countryCode: countryCode,
          });
        } else {
          console.error('🔐 LoginScreen: Phone verification failed:', result.message);
          Alert.alert('Error', result.message || 'Failed to send verification code. Please try again.');
        }
      } else {
        // Username/email authentication
        console.log('🔐 LoginScreen: Attempting username/password login...');
        const result = await login(username.trim(), password);
        
        if (result.success) {
          console.log('🔐 LoginScreen: Login successful');
          Alert.alert('Success', SUCCESS_MESSAGES.LOGIN_SUCCESS);
        } else {
          console.error('🔐 LoginScreen: Login failed:', result.error);
          Alert.alert('Error', result.error || ERROR_MESSAGES.LOGIN_FAILED);
        }
      }
    } catch (error) {
      console.error('🔐 LoginScreen: Unexpected error during login:', error);
      Alert.alert('Error', ERROR_MESSAGES.NETWORK_ERROR);
    }
  };

  const formatPhoneNumber = (phone, country) => {
    const cleanPhone = phone.replace(/\s|-|\(|\)/g, '');
    
    if (country === '+251') {
      // Convert to international format
      if (cleanPhone.startsWith('0')) {
        return '+251' + cleanPhone.slice(1);
      } else if (!cleanPhone.startsWith('+251')) {
        return '+251' + cleanPhone;
      }
      return cleanPhone;
    } else if (country === '+1') {
      // Convert to international format
      if (cleanPhone.length === 10) {
        return '+1' + cleanPhone;
      } else if (!cleanPhone.startsWith('+1')) {
        return '+1' + cleanPhone;
      }
      return cleanPhone;
    }
    return phone;
  };

  const handleRegisterPress = () => {
    navigation.navigate('Register');
  };

  // Handle Google OAuth success
  const handleGoogleSuccess = async (result) => {
    try {
      console.log('🔐 LoginScreen: Google OAuth success:', result);
      
      if (result.success) {
        // The GoogleSignIn component already stored the token in AsyncStorage
        // We need to trigger a re-check of authentication status in AuthContext
        // by calling checkAuthStatus or refreshing the auth state
        
        console.log('🔐 LoginScreen: Google OAuth completed, refreshing auth state...');
        
        // Force AuthContext to re-check authentication status
        // This will detect the stored token and user data
        await checkAuthStatus();
        
        Alert.alert('Success', 'Successfully signed in with Google!');
      }
    } catch (error) {
      console.error('🔐 LoginScreen: Error handling Google OAuth success:', error);
      Alert.alert('Error', 'Failed to complete Google sign-in');
    }
  };

  // Handle Google OAuth error
  const handleGoogleError = (error) => {
    console.error('🔐 LoginScreen: Google OAuth error:', error);
    Alert.alert('Error', error || 'Google sign-in failed');
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality will be implemented soon.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWithIcon}>
                <Icon name="home" size={32} color="#000000" style={styles.logoIcon} />
                <Text style={styles.logo}>Ereft</Text>
              </View>
            </View>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.subtitleText}>
              Sign in to access your account and find your perfect home
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Login Method Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleButton, loginMethod === 'username' && styles.toggleButtonActive]}
                onPress={() => {
                  setLoginMethod('username');
                  setUsername('');
                  setErrors({});
                }}
              >
                <Text style={[styles.toggleText, loginMethod === 'username' && styles.toggleTextActive]}>
                  Username/Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, loginMethod === 'phone' && styles.toggleButtonActive]}
                onPress={() => {
                  setLoginMethod('phone');
                  setUsername('');
                  setErrors({});
                }}
              >
                <Text style={[styles.toggleText, loginMethod === 'phone' && styles.toggleTextActive]}>
                  Phone Number
                </Text>
              </TouchableOpacity>
            </View>

            {loginMethod === 'phone' ? (
              /* Phone Number Input */
              <>
                {/* Country Selection */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <View style={styles.countryContainer}>
                    <TouchableOpacity 
                      style={[styles.countryButton, countryCode === '+251' && styles.countryButtonActive]}
                      onPress={() => setCountryCode('+251')}
                    >
                      <Text style={styles.countryFlag}>🇪🇹</Text>
                      <Text style={[styles.countryText, countryCode === '+251' && styles.countryTextActive]}>
                        Ethiopia (+251)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.countryButton, countryCode === '+1' && styles.countryButtonActive]}
                      onPress={() => setCountryCode('+1')}
                    >
                      <Text style={styles.countryFlag}>🇺🇸</Text>
                      <Text style={[styles.countryText, countryCode === '+1' && styles.countryTextActive]}>
                        USA (+1)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Phone Number Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder={countryCode === '+251' ? '912345678' : '2025551234'}
                      placeholderTextColor="#6C757D"
                      value={phoneNumber}
                      onChangeText={(text) => {
                        setPhoneNumber(text);
                        if (errors.phone) {
                          setErrors({ ...errors, phone: null });
                        }
                      }}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                    />
                  </View>
                  {errors.phone && (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  )}
                </View>

                {/* Test Numbers Info */}
                <View style={styles.testInfoContainer}>
                  <Text style={styles.testInfoTitle}>📱 Test Numbers (Development):</Text>
                  <Text style={styles.testInfoText}>
                    🇪🇹 Ethiopia: +251911111111 (code: 123456)
                  </Text>
                  <Text style={styles.testInfoText}>
                    🇺🇸 USA: +12025551234 (code: 111111)
                  </Text>
                  <Text style={styles.testInfoNote}>
                    Other numbers work too - use any 6-digit code!
                  </Text>
                </View>
              </>
            ) : (
              /* Username/Email Input */
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username or Email</Text>
                <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
                  <Icon 
                    name="person" 
                    size={20} 
                    color="#6C757D" 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter username or email"
                    placeholderTextColor="#6C757D"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (errors.username) {
                        setErrors({ ...errors, username: null });
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                  />
                </View>
                {errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>
            )}

            {/* Password Input - Only show for username/email login */}
            {loginMethod === 'username' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                  <Icon name="lock" size={20} color="#6C757D" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#6C757D"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors({ ...errors, password: null });
                      }
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color="#6C757D"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>
            )}

            {/* Forgot Password - Only show for username/email login */}
            {loginMethod === 'username' && (
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Demo Credentials Info - Only show for username/email login */}
            {loginMethod === 'username' && (
              <View style={styles.demoInfoContainer}>
                <Text style={styles.demoInfoTitle}>🧪 Demo Credentials:</Text>
                <Text style={styles.demoInfoText}>
                  Username: <Text style={styles.demoCredential}>demo</Text> | Password: <Text style={styles.demoCredential}>demo123</Text>
                </Text>
                <Text style={styles.demoInfoText}>
                  Username: <Text style={styles.demoCredential}>admin</Text> | Password: <Text style={styles.demoCredential}>admin123</Text>
                </Text>
                <Text style={styles.demoInfoNote}>
                  Use these credentials to test the app!
                </Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.loginButtonText}>
                  {loginMethod === 'phone' ? 'Sending Code...' : 'Signing In...'}
                </Text>
              ) : (
                <Text style={styles.loginButtonText}>
                  {loginMethod === 'phone' ? 'Send Verification Code' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Login Buttons */}
            <GoogleSignIn 
              style={styles.socialButton} 
              textStyle={styles.socialButtonText}
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleRegisterPress}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    marginRight: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#006AFF',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputError: {
    borderColor: '#DC3545',
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  passwordToggle: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#DC3545',
    marginTop: 6,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#006AFF',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#006AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#006AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#6C757D',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E9ECEF',
  },
  dividerText: {
    fontSize: 14,
    color: '#6C757D',
    marginHorizontal: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  socialButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginLeft: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  registerText: {
    fontSize: 16,
    color: '#6C757D',
  },
  registerLink: {
    fontSize: 16,
    color: '#006AFF',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#006AFF',
    shadowColor: '#006AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  countryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  countryButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#006AFF',
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryText: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  countryTextActive: {
    color: '#006AFF',
    fontWeight: '600',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#E9ECEF',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  testInfoContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#006AFF',
  },
  testInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  testInfoText: {
    fontSize: 11,
    color: '#1A1A1A',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  testInfoNote: {
    fontSize: 10,
    color: '#6C757D',
    fontStyle: 'italic',
    marginTop: 4,
  },
  demoInfoContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#006AFF',
  },
  demoInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  demoInfoText: {
    fontSize: 11,
    color: '#1A1A1A',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  demoCredential: {
    fontWeight: '600',
    color: '#006AFF',
  },
  demoInfoNote: {
    fontSize: 10,
    color: '#6C757D',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default LoginScreen;
