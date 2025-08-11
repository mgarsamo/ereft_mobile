# Firebase Setup Guide for Ereft App

## Overview
This guide covers the complete Firebase configuration for the Ereft app, including Google Sign-In and Phone Authentication for both iOS and Android platforms.

## Firebase Project Details
- **Project ID**: `ereft-6fd24`
- **Project Number**: `1000845422249`
- **Web API Key**: `AIzaSyAd0Woihl3LP8mWDNO3o41A6BfaFnFIMYo`
- **Support Email**: melaku.garsamo@gmail.com

## Required Firebase Console Configuration

### 1. Authentication Settings

#### Authorized Domains
Add these domains to Firebase Console > Authentication > Settings > Authorized Domains:
- `localhost`
- `ereft-6fd24.firebaseapp.com`
- `ereft-6fd24.web.app`
- `auth.expo.io`
- `ereft.onrender.com`

#### Sign-in Methods

##### Google Sign-In
1. Enable Google Sign-In in Firebase Console > Authentication > Sign-in method
2. Add authorized OAuth redirect URIs:
   - `ereft://oauth` (iOS/Android production)
   - `exp://[ip]:[port]/oauth` (Expo development)

##### Phone Authentication
1. Enable Phone Authentication in Firebase Console > Authentication > Sign-in method
2. **IMPORTANT**: Add your Apple Developer Team ID for iOS production
   - Go to iOS app settings in Firebase Console
   - Add Team ID: `7U44S23G23` (from your EAS configuration)
   - This is required for APNs and phone auth to work on iOS

### 2. iOS App Configuration

#### Bundle ID
- **Bundle ID**: `com.mgarsamo.ereft`
- **App Store ID**: `6749805995`

#### OAuth Client Configuration
- **iOS OAuth Client ID**: `1000845422249-sbouec678bhba2m170q4501jp46kgmlk.apps.googleusercontent.com`
- **iOS URL Scheme**: `com.googleusercontent.apps.1000845422249-sbouec678bhba2m170q4501jp46kgmlk`

#### Required for Production Phone Auth
1. **Apple Developer Team ID**: `7U44S23G23`
2. **APNs Authentication Key**: Upload your APNs key to Firebase Console
3. **Associated Domains**: Add `applinks:ereft-6fd24.firebaseapp.com` to your iOS app

### 3. Android App Configuration

#### Package Name
- **Package Name**: `com.mgarsamo.ereft`

#### SHA-1 Certificate Fingerprint
You need to add your Android app's SHA-1 certificate fingerprint to Firebase Console:

1. **Development SHA-1** (for Expo development):
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

2. **Production SHA-1** (for your release keystore):
   ```bash
   keytool -list -v -keystore your-release-keystore.jks -alias your-key-alias
   ```

3. Add both SHA-1 fingerprints to Firebase Console > Project Settings > Your Android App

### 4. reCAPTCHA Configuration

#### Site Key
- **Site Key**: `6Lekw6ArAAAAAIkGbWpaj52_gdu5S29Vx53Xy_xS`
- **Domain**: `ereft-6fd24.firebaseapp.com`

#### iOS Configuration
For iOS phone auth to work properly:
1. Ensure reCAPTCHA is enabled in Firebase Console
2. Add your iOS bundle ID to reCAPTCHA allowed domains
3. Configure APNs if you want to avoid reCAPTCHA fallback

## Project Configuration Files

### 1. Firebase Config (`src/config/firebase.js`)
```javascript
const firebaseConfig = {
  apiKey: 'AIzaSyAd0Woihl3LP8mWDNO3o41A6BfaFnFIMYo',
  authDomain: 'ereft-6fd24.firebaseapp.com',
  projectId: 'ereft-6fd24',
  storageBucket: 'ereft-6fd24.appspot.com',
  messagingSenderId: '1000845422249',
  appId: '1:1000845422249:ios:60a1d70078dbcf2ec783b8',
  databaseURL: 'https://ereft-6fd24-default-rtdb.firebaseio.com',
};
```

### 2. Environment Config (`src/config/env.js`)
```javascript
export const ENV = {
  FIREBASE_API_KEY: 'AIzaSyAd0Woihl3LP8mWDNO3o41A6BfaFnFIMYo',
  FIREBASE_PROJECT_ID: 'ereft-6fd24',
  RECAPTCHA_SITE_KEY: '6Lekw6ArAAAAAIkGbWpaj52_gdu5S29Vx53Xy_xS',
  GOOGLE_CLIENT_ID: __DEV__ 
    ? '260862382785-8dd7424usg8g9nsovlm5r7v2qurrncgq.apps.googleusercontent.com'
    : '1000845422249-sbouec678bhba2m170q4501jp46kgmlk.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: '1000845422249-sbouec678bhba2m170q4501jp46kgmlk.apps.googleusercontent.com',
};
```

### 3. App Configuration (`app.json`)
```json
{
  "ios": {
    "bundleIdentifier": "com.mgarsamo.ereft",
    "CFBundleURLSchemes": ["ereft", "exp"]
  },
  "android": {
    "package": "com.mgarsamo.ereft"
  }
}
```

## Testing Checklist

### Development Testing
- [ ] Google Sign-In works in Expo development
- [ ] Phone auth works with test numbers
- [ ] reCAPTCHA modal appears correctly
- [ ] OAuth redirects work with `exp://` scheme

### Production Testing
- [ ] Google Sign-In works on iOS device
- [ ] Google Sign-In works on Android device
- [ ] Phone auth works on iOS device
- [ ] Phone auth works on Android device
- [ ] reCAPTCHA works on both platforms

## Common Issues & Solutions

### 1. "reCAPTCHA not ready" Error
- Ensure `FirebaseRecaptchaVerifierModal` is properly mounted
- Check that `setRecaptchaVerifier` is called after component mount
- Verify reCAPTCHA site key is correct

### 2. Google Sign-In Redirect Issues
- Development: Use `exp://` scheme with Expo proxy
- Production: Use `ereft://` scheme
- Ensure OAuth client IDs match in Firebase Console

### 3. Phone Auth Not Working on iOS
- Add Apple Developer Team ID to Firebase Console
- Configure APNs authentication key
- Ensure bundle ID matches exactly

### 4. "Invalid OAuth client" Errors
- Verify OAuth client IDs in `google-services.json` and `GoogleService-Info.plist`
- Check that package names/bundle IDs match exactly
- Ensure SHA-1 fingerprints are added for Android

## Next Steps

1. **Add Apple Developer Team ID** to Firebase Console iOS app settings
2. **Generate and add Android SHA-1 fingerprints** to Firebase Console
3. **Test phone authentication** on both platforms
4. **Verify Google Sign-In** works in production builds
5. **Configure APNs** for better iOS phone auth experience

## Support

If you encounter issues:
1. Check Firebase Console logs
2. Verify all configuration files match
3. Test with development vs production builds
4. Check Expo and Firebase documentation for latest updates
