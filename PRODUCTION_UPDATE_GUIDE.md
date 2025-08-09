# 📱 Mobile App Production Update Guide

## 🎯 After Backend Deployment

Once your backend is deployed to Render and you have the production URL, follow these steps to update the mobile app:

### Step 1: Update API Configuration

**File**: `src/config/api.js`
```javascript
// Replace localhost with your Render URL
export const API_BASE_URL = 'https://ereft-api.onrender.com'; // Your actual Render URL

// Keep other configurations
export const API_TIMEOUT = 10000;
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};
```

### Step 2: Update Environment Configuration (if exists)

**File**: `src/config/env.js`
```javascript
export const ENV_CONFIG = {
  API_BASE_URL: 'https://ereft-api.onrender.com', // Production API
  GOOGLE_MAPS_API_KEY: 'AIzaSyA4-mia5UmIz5P3Nfq4pc9sbx19oco1uIg',
  // Add other production environment variables
};
```

### Step 3: Test Authentication

After updating the API URL, test these features:
1. **Login** with username/password
2. **Register** new user
3. **Property browsing**
4. **User profile** and stats
5. **Favorites** functionality

### Step 4: Update App Configuration for Production

**File**: `app.json`
```json
{
  "expo": {
    "name": "Ereft - Ethiopian Real Estate",
    "slug": "ereft-mobile",
    "version": "1.0.0",
    "description": "Ethiopia's premier real estate platform",
    "privacy": "public",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.ereft.realestate",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.ereft.realestate",
      "versionCode": 1
    }
  }
}
```

### Step 5: Build for Production

```bash
# Install dependencies
npm install

# Test locally first
npx expo start

# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android --type app-bundle
```

### Step 6: App Store Submission

1. **iOS App Store**
   - Create app in App Store Connect
   - Upload build using Xcode or Application Loader
   - Fill in app metadata and screenshots

2. **Google Play Store**
   - Create app in Google Play Console
   - Upload AAB file
   - Complete store listing

## 🧪 Testing Checklist

Before submitting to app stores, verify:

- [ ] **Authentication**: Login/register works with production API
- [ ] **Property Listings**: Properties load from production database
- [ ] **Search & Filters**: Search functionality works
- [ ] **Maps Integration**: Google Maps shows property locations
- [ ] **User Profile**: Profile data loads correctly
- [ ] **Favorites**: Can add/remove favorites
- [ ] **Error Handling**: Proper error messages for network issues
- [ ] **Offline Behavior**: App handles no internet gracefully

## 🚀 Production Deployment Commands

```bash
# 1. Update API URL
# Edit src/config/api.js with production URL

# 2. Test locally
npx expo start --clear

# 3. Commit changes
git add -A
git commit -m "📱 Updated for production API deployment

✅ Changes:
- Updated API_BASE_URL to production Render URL
- Verified authentication works with production backend
- Tested all major features with live API
- Ready for app store submission

🌐 Production API: https://ereft-api.onrender.com
🚀 Status: Ready for App Store & Play Store"

# 4. Push to GitHub
git push origin main

# 5. Build for stores
npx expo build:ios --type archive
npx expo build:android --type app-bundle
```

## 📞 Support & Troubleshooting

### Common Issues:

1. **Network Error on Login**
   - Verify production API URL is correct
   - Check CORS settings in backend
   - Ensure SSL certificate is valid

2. **401 Unauthorized Errors**
   - Verify authentication endpoints are working
   - Check token storage and retrieval
   - Test with production database users

3. **Properties Not Loading**
   - Check if properties exist in production database
   - Verify API endpoints return data
   - Test pagination and filtering

### Debug Mode:
```javascript
// Temporarily enable debug logging
console.log('API URL:', API_BASE_URL);
console.log('Request:', requestConfig);
console.log('Response:', response);
```

---

**🎉 Once updated, your mobile app will connect to the live production API!**
