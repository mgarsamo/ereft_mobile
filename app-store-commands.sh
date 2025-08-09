#!/bin/bash

# 🍎 Ereft - Apple App Store Submission Commands
# Run these commands in sequence to build and submit your app

echo "🍎 Ereft - Apple App Store Submission Process"
echo "=============================================="

# Step 1: Install EAS CLI (if not already installed)
echo "📦 Step 1: Installing EAS CLI..."
npm install -g @expo/eas-cli

# Step 2: Login to Expo
echo "🔐 Step 2: Login to Expo account..."
eas login

# Step 3: Configure EAS Build (creates eas.json)
echo "⚙️  Step 3: Configure EAS Build..."
eas build:configure

# Step 4: Create development build (for testing)
echo "🛠️  Step 4: Creating development build..."
eas build --platform ios --profile development

# Step 5: Create preview build (for TestFlight)
echo "🧪 Step 5: Creating preview build for TestFlight..."
eas build --platform ios --profile preview

# Step 6: Test the preview build thoroughly
echo "✅ Step 6: Test your app thoroughly with TestFlight"
echo "   - Download TestFlight app on your iPhone"
echo "   - Install and test your app"
echo "   - Fix any bugs found"

# Step 7: Create production build
echo "🚀 Step 7: Creating production build..."
eas build --platform ios --profile production

# Step 8: Submit to App Store
echo "📱 Step 8: Submit to App Store..."
eas submit --platform ios

echo ""
echo "🎉 Submission Complete!"
echo "✅ Next steps:"
echo "   1. Go to App Store Connect"
echo "   2. Complete app information and screenshots"
echo "   3. Submit for review"
echo "   4. Wait for Apple's review (24-48 hours)"
echo ""
echo "📞 Support: If you need help, contact Apple Developer Support"
echo "🌐 App Store Connect: https://appstoreconnect.apple.com"
