# 🔥 Firebase Configuration Guide for Ereft

## 📋 Configuration Summary

### ✅ Current Configuration Status
- **Project ID**: ereft-6fd24 ✅
- **iOS Bundle ID**: com.mgarsamo.ereft ✅
- **Android Package**: com.mgarsamo.ereft ✅
- **reCAPTCHA Site Key**: 6Lekw6ArAAAAAIkGbWpaj52_gdu5S29Vx53Xy_xS ✅

## 🔧 Required Firebase Console Updates

### 1. Authentication > Sign-in method

#### Google Sign-in
- ✅ **Enabled** for iOS and Android
- **iOS Client ID**: 1000845422249-sbouec678bhba2m170q4501jp46kgmlk.apps.googleusercontent.com
- **Android Client ID**: 260862382785-bkr2mukc06lo72p37dusc2vcc96v0aj2.apps.googleusercontent.com
- **Web Client ID**: 260862382785-8dd7424usg8g9nsovlm5r7v2qurrncgq.apps.googleusercontent.com

#### Phone Authentication
- ✅ **Enabled** with reCAPTCHA verification
- **reCAPTCHA Site Key**: 6Lekw6ArAAAAAIkGbWpaj52_gdu5S29Vx53Xy_xS
- **Test Phone Numbers**: Add your test numbers here

### 2. Authorized Domains
Add these domains to Firebase Console > Authentication > Settings > Authorized domains:
```
localhost
ereft-6fd24.firebaseapp.com
ereft-6fd24.web.app
ereft.firebaseapp.com
auth.expo.io
ereft.onrender.com
```

### 3. OAuth Redirect URIs
Add these redirect URIs for Google OAuth:

#### iOS
```
ereft://oauth
com.googleusercontent.apps.1000845422249-sbouec678bhba2m170q4501jp46kgmlk://oauth
```

#### Android
```
ereft://oauth
```

#### Web
```
http://localhost:3000/oauth
https://ereft.onrender.com/oauth
```

## 📱 Mobile App Configuration

### iOS Configuration
- **Bundle ID**: com.mgarsamo.ereft ✅
- **App Store ID**: 6749805995 ✅
- **Team ID**: 7U44S23G23 ✅
- **GoogleService-Info.plist**: ✅ Located in project root

### Android Configuration
- **Package Name**: com.mgarsamo.ereft ✅
- **google-services.json**: ✅ Located in project root
- **SHA1 Certificate Hash**: ⚠️ **NEEDS TO BE UPDATED**

## 🚨 Critical Issues to Fix

### 1. Android SHA1 Certificate Hash
**Current Status**: `YOUR_ANDROID_SHA1_CERTIFICATE_HASH` (placeholder)

**Action Required**: 
1. Generate your Android app's SHA1 certificate hash
2. Update `google-services.json` with the real hash
3. Add the hash to Firebase Console > Project Settings > Your Apps > Android

**Generate SHA1 Command**:
```bash
# For debug builds
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release builds (if you have a keystore)
keytool -list -v -keystore your-release-keystore.jks -alias your-key-alias
```

### 2. Firebase reCAPTCHA Configuration
**Current Status**: ✅ Configured in app.json and firebase.js

**Verification**:
- reCAPTCHA site key is properly set
- expo-firebase-recaptcha plugin is configured
- Phone authentication uses reCAPTCHA verification

## 🧪 Testing Checklist

### Google Sign-in Testing
- [ ] iOS: Test with iOS client ID
- [ ] Android: Test with Android client ID
- [ ] Verify OAuth redirect URIs work
- [ ] Check token exchange works

### Phone Authentication Testing
- [ ] iOS: Test with reCAPTCHA verification
- [ ] Android: Test with reCAPTCHA verification
- [ ] Verify SMS codes are received
- [ ] Test rate limiting

### Firebase Console Verification
- [ ] Authentication methods enabled
- [ ] Authorized domains added
- [ ] OAuth redirect URIs configured
- [ ] reCAPTCHA site key active

## 🔄 Update Commands

### Update Dependencies
```bash
cd ereft_mobile
npm install
npx expo install --fix
```

### Test Configuration
```bash
# Test Firebase connection
npx expo start --tunnel

# Check for configuration errors
npx expo doctor
```

## 📞 Support

If you encounter issues:
1. Check Firebase Console for error logs
2. Verify all client IDs match your Firebase project
3. Ensure reCAPTCHA site key is active
4. Check that authorized domains include all necessary URLs

## 🎯 Next Steps

1. **Immediate**: Update Android SHA1 certificate hash
2. **Verify**: Test Google Sign-in on both platforms
3. **Test**: Verify phone authentication with reCAPTCHA
4. **Deploy**: Ensure production builds work correctly

---

**Last Updated**: $(date)
**Status**: Configuration Complete (Pending Android SHA1)
