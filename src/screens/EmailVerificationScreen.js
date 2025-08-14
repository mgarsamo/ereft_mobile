import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const EmailVerificationScreen = ({ route, navigation }) => {
  const { verifyEmail, sendSmsVerification } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState('email'); // 'email' or 'sms'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isVerifyingSms, setIsVerifyingSms] = useState(false);

  const { token, email, userId } = route.params || {};

  useEffect(() => {
    if (!token) {
      Alert.alert('Error', 'No verification token provided');
      navigation.goBack();
    }
  }, [token, navigation]);

  const handleEmailVerification = async () => {
    if (!token) {
      Alert.alert('Error', 'No verification token provided');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyEmail(token);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          result.message,
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to main app
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Email verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendSmsVerification = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setIsSendingSms(true);
    try {
      const result = await sendSmsVerification(phoneNumber);
      
      if (result.success) {
        Alert.alert('Success', 'SMS verification code sent to your phone');
        setVerificationStep('sms');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send SMS verification code');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleVerifySmsCode = async () => {
    if (!smsCode || smsCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    setIsVerifyingSms(true);
    try {
      const result = await verifySmsCode(phoneNumber, smsCode);
      
      if (result.success) {
        Alert.alert(
          'Success!',
          'Phone verification completed. Your account is now fully verified.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to main app
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'SMS verification failed. Please try again.');
    } finally {
      setIsVerifyingSms(false);
    }
  };

  const renderEmailVerification = () => (
    <View style={styles.stepContainer}>
      <Icon name="email" size={80} color="#4A90E2" style={styles.icon} />
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        We've sent a verification link to:
      </Text>
      <Text style={styles.email}>{email}</Text>
      <Text style={styles.description}>
        Click the button below to verify your email address and activate your account.
      </Text>
      
      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handleEmailVerification}
        disabled={isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.verifyButtonText}>Verify Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => setVerificationStep('sms')}
      >
        <Text style={styles.skipButtonText}>Skip & Verify Phone Instead</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSmsVerification = () => (
    <View style={styles.stepContainer}>
      <Icon name="phone" size={80} color="#4A90E2" style={styles.icon} />
      <Text style={styles.title}>Verify Your Phone</Text>
      <Text style={styles.subtitle}>
        Enter your phone number to receive a verification code
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+251 9XXXXXXXX"
          keyboardType="phone-pad"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={styles.verifyButton}
        onPress={handleSendSmsVerification}
        disabled={isSendingSms}
      >
        {isSendingSms ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.verifyButtonText}>Send Verification Code</Text>
        )}
      </TouchableOpacity>

      {verificationStep === 'sms' && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Verification Code</Text>
            <TextInput
              style={styles.input}
              value={smsCode}
              onChangeText={setSmsCode}
              placeholder="Enter 6-digit code"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerifySmsCode}
            disabled={isVerifyingSms}
          >
            {isVerifyingSms ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Code</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setVerificationStep('email')}
      >
        <Text style={styles.backButtonText}>← Back to Email Verification</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Verification</Text>
          <View style={styles.placeholder} />
        </View>

        {verificationStep === 'email' ? renderEmailVerification() : renderSmsVerification()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 44,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  verifyButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 10,
  },
  skipButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  backButton: {
    paddingVertical: 10,
    marginTop: 20,
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default EmailVerificationScreen;
