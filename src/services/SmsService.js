import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SMS Service for phone verification
 * This service handles SMS verification with local fallback for development
 */
class SmsService {
  constructor() {
    this.verifications = new Map();
    this.testNumbers = new Map([
      ['+13123582763', '123456'], // Test number for development
      ['+251911234567', '123456'], // Ethiopian test number
    ]);
  }

  async sendVerificationCode(phoneNumber) {
    try {
      console.log('📱 SmsService: Sending verification to', phoneNumber);

      // For now, use test mode for all numbers since Firebase is not configured
      // In production, this would integrate with a real SMS service
      console.log('📱 Development mode - using fallback verification');
      return this.handleTestVerification(phoneNumber);

    } catch (error) {
      console.error('📱 SMS Service Error:', error);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.',
      };
    }
  }

  handleTestVerification(phoneNumber) {
    // Generate a random 6-digit code for development
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const verificationData = {
      phoneNumber,
      code: testCode,
      verificationId,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 3,
      isTestNumber: true,
    };

    // Store verification data
    this.verifications.set(verificationId, verificationData);
    AsyncStorage.setItem(
      `verification_${verificationId}`,
      JSON.stringify(verificationData)
    );

    console.log('📱 Development fallback code generated:', testCode);
    return {
      success: true,
      message: `Development mode: Use code ${testCode}`,
      verificationId,
      isTestNumber: true,
    };
  }

  async verifyCode(verificationId, code) {
    try {
      // Get verification data from storage
      const verificationDataString = await AsyncStorage.getItem(`verification_${verificationId}`);
      if (!verificationDataString) {
        return {
          success: false,
          message: 'Verification session expired. Please request a new code.',
        };
      }

      const verificationData = JSON.parse(verificationDataString);

      // Check attempts
      if (verificationData.attempts >= verificationData.maxAttempts) {
        await this.cleanupVerification(verificationId);
        return {
          success: false,
          message: 'Too many attempts. Please request a new verification code.',
        };
      }

      // Increment attempts
      verificationData.attempts++;
      await AsyncStorage.setItem(
        `verification_${verificationId}`,
        JSON.stringify(verificationData)
      );

      // Handle test verification
      if (verificationData.isTestNumber) {
        if (code === verificationData.code) {
          this.cleanupVerification(verificationId);
          return {
            success: true,
            message: 'Phone number verified successfully!',
            phoneNumber: verificationData.phoneNumber,
          };
        } else {
          const remainingAttempts = verificationData.maxAttempts - verificationData.attempts;
          return {
            success: false,
            message: `Invalid code. ${remainingAttempts} attempts remaining.`,
          };
        }
      }

      return {
        success: false,
        message: 'Invalid verification session.',
      };

    } catch (error) {
      console.error('📱 Verification Error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.',
      };
    }
  }

  async cleanupVerification(verificationId) {
    try {
      // Remove from memory
      this.verifications.delete(verificationId);
      
      // Remove from AsyncStorage
      await AsyncStorage.removeItem(`verification_${verificationId}`);
      
      console.log('📱 Cleaned up verification:', verificationId);
    } catch (error) {
      console.error('📱 Error cleaning up verification:', error);
    }
  }

  async resendCode(phoneNumber) {
    try {
      console.log('📱 SmsService: Resending code to', phoneNumber);
      return await this.sendVerificationCode(phoneNumber);
      
    } catch (error) {
      console.error('📱 Resend Error:', error);
      return {
        success: false,
        message: 'Failed to resend code. Please try again.',
      };
    }
  }

  getTestNumbers() {
    return Array.from(this.testNumbers.keys());
  }
}

export default new SmsService();
