# 🔥 Firebase Console Configuration Checklist

## 🚨 **CRITICAL: Phone Authentication Test Failed**

**Error**: `auth/operation-not-supported-in-this-environment`
**Status**: ⚠️ Configuration issue detected

## 📋 **Required Firebase Console Updates**

### 1. **Authentication > Sign-in method**

#### ✅ **Phone Authentication MUST be enabled**
- Go to: https://console.firebase.google.com/project/ereft-6fd24/authentication/sign-in
- **Enable** Phone Authentication
- **Enable** reCAPTCHA verification
- **Add** your phone number as a test number: `+2513123582763`

#### ✅ **Google Sign-in MUST be enabled**
- **Enable** Google Sign-in for iOS and Android
- Verify client IDs are correct

### 2. **Project Settings > General**

#### ✅ **Authorized Domains**
Add these domains to Firebase Console > Authentication > Settings > Authorized domains:
```
localhost
ereft-6fd24.firebaseapp.com
ereft-6fd24.web.app
ereft.firebaseapp.com
auth.expo.io
ereft.onrender.com
```

### 3. **Project Settings > Your Apps**

#### ✅ **iOS App Configuration**
- Bundle ID: `com.mgarsamo.ereft` ✅
- App Store ID: `6749805995` ✅
- Team ID: `7U44S23G23` ✅

#### ⚠️ **Android App Configuration**
- Package name: `com.mgarsamo.ereft` ✅
- **SHA1 Certificate Hash**: ⚠️ **MISSING** - This will prevent authentication

### 4. **Authentication > Users**

#### ✅ **Test Phone Numbers**
Add your phone number as a test number:
- Phone: `+2513123582763`
- Purpose: Development testing
- This allows you to receive SMS codes without using real SMS quotas

## 🔧 **Immediate Actions Required**

### **Step 1: Enable Phone Authentication**
1. Go to [Firebase Console > Authentication](https://console.firebase.google.com/project/ereft-6fd24/authentication)
2. Click **Sign-in method** tab
3. Find **Phone** in the list
4. Click **Enable** if not already enabled
5. **Enable** reCAPTCHA verification
6. **Add** `+2513123582763` as a test phone number

### **Step 2: Add Authorized Domains**
1. Go to [Firebase Console > Project Settings](https://console.firebase.google.com/project/ereft-6fd24/settings/general)
2. Scroll down to **Authorized domains**
3. Add all the domains listed above

### **Step 3: Generate Android SHA1 Hash**
1. Run the SHA1 generation script:
   ```bash
   ./generate-sha1.sh
   ```
2. Copy the generated SHA1 hash
3. Add it to Firebase Console > Project Settings > Your Apps > Android

## 🧪 **Testing After Configuration**

### **Test 1: Firebase Console Verification**
- [ ] Phone Authentication is enabled
- [ ] reCAPTCHA verification is enabled
- [ ] Test phone number is added
- [ ] Authorized domains are configured

### **Test 2: React Native App Testing**
1. **Start your Expo app**:
   ```bash
   npx expo start --tunnel
   ```

2. **Test Phone Authentication**:
   - Go to Phone Authentication screen
   - Enter your number: `+2513123582763`
   - Complete reCAPTCHA verification
   - Check if SMS code is received

3. **Test Google Sign-in**:
   - Try Google Sign-in button
   - Verify OAuth flow works

## 🚨 **Common Issues & Solutions**

### **Issue 1: Phone Authentication Not Enabled**
**Solution**: Enable in Firebase Console > Authentication > Sign-in method

### **Issue 2: reCAPTCHA Verification Fails**
**Solution**: 
- Verify reCAPTCHA site key is correct
- Check if domain is authorized
- Ensure reCAPTCHA is enabled for phone auth

### **Issue 3: SMS Not Received**
**Solution**:
- Check if phone number is added as test number
- Verify SMS quotas in Firebase Console
- Check billing status

### **Issue 4: Android Authentication Fails**
**Solution**:
- Generate and add SHA1 certificate hash
- Update google-services.json
- Verify package name matches

## 🔗 **Firebase Console Links**

- **Authentication**: https://console.firebase.google.com/project/ereft-6fd24/authentication
- **Sign-in Methods**: https://console.firebase.google.com/project/ereft-6fd24/authentication/sign-in
- **Project Settings**: https://console.firebase.google.com/project/ereft-6fd24/settings/general
- **Your Apps**: https://console.firebase.google.com/project/ereft-6fd24/settings/general

## 📞 **Next Steps**

1. **Immediate**: Check Firebase Console for Phone Authentication settings
2. **Today**: Enable Phone Authentication and add test phone number
3. **This Week**: Test in React Native app and fix any remaining issues
4. **Next Week**: Deploy production builds

---

**Status**: ⚠️ Phone Authentication needs Firebase Console configuration
**Priority**: HIGH - This affects core app functionality
**Next Action**: Enable Phone Authentication in Firebase Console
