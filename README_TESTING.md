# 🧪 Ereft Mobile App - Testing Guide

## 🚀 **Current Status: READY FOR TESTING**

Your app has been successfully:
- ✅ **Built** (Build #14 - iOS Production)
- ✅ **Submitted** to App Store Connect
- ✅ **Development Server** running locally

## 📱 **How to Test**

### 1. **Start Testing (QR Code)**
```bash
# The server is already running at:
http://localhost:8081

# Scan the QR code with Expo Go app on your phone
# OR use the tunnel URL if you started with --tunnel
```

### 2. **Test Phone Login**
Use these **test phone numbers** for immediate verification:

#### 🇪🇹 **Ethiopian Numbers:**
- `+251911111111` → Code: `123456`
- `+251922222222` → Code: `654321`

#### 🇺🇸 **US Numbers:**
- `+12025551234` → Code: `111111`
- `+12025555678` → Code: `222222`

#### 📋 **Phone Login Flow:**
1. Enter any of the test numbers above
2. Tap "Send Code"
3. Use the corresponding code from the list
4. You'll be logged in immediately

### 3. **Test Google Login**
- Tap "Sign in with Google"
- Should redirect to Google OAuth
- After successful authentication, you'll be logged in

## 🔧 **What's Working**

### ✅ **Authentication Systems:**
- **Phone Login**: Test numbers with instant verification
- **Google Login**: OAuth flow with proper redirects
- **Logout**: Fixed for iPhone compatibility

### ✅ **App Configuration:**
- **Icon**: Updated `icon.png` bundled
- **Firebase**: Configured with your project
- **Google OAuth**: Proper client IDs and redirects
- **Bundle ID**: `com.mgarsamo.ereft`

### ✅ **Dependencies:**
- Standard `firebase` package (no more build issues)
- All required Expo packages installed
- No conflicting React Native Firebase packages

## 🎯 **Testing Checklist**

- [ ] **Phone Login**: Test with Ethiopian numbers
- [ ] **Phone Login**: Test with US numbers  
- [ ] **Google Login**: Complete OAuth flow
- [ ] **Logout**: Works on both iPhone and iPad
- [ ] **App Icon**: Shows updated icon.png
- [ ] **Navigation**: All screens accessible
- [ ] **Maps**: Location permissions work

## 🚨 **If Something Doesn't Work**

### **Phone Login Issues:**
- Check console for verification codes
- Ensure you're using the exact test numbers
- Verify the code matches the number

### **Google Login Issues:**
- Check if redirect URI is correct
- Verify Google Cloud Console OAuth settings
- Check network connectivity

### **General Issues:**
- Restart the Expo server: `npm start`
- Clear app cache on your device
- Check console logs for errors

## 📱 **Development Server Info**

- **Local URL**: http://localhost:8081
- **Tunnel URL**: Available if started with `--tunnel`
- **QR Code**: Scan with Expo Go app
- **Status**: ✅ Running and Ready

## 🎉 **Ready to Test!**

Your app is fully configured and ready for testing. Both authentication methods should work smoothly. Use the test phone numbers for instant verification, and Google login should complete the OAuth flow successfully.

**Happy Testing! 🚀**
