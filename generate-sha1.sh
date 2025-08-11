#!/bin/bash

# 🔑 Generate Android SHA1 Certificate Hash for Firebase
# This script helps generate the SHA1 hash needed for Firebase Android configuration

echo "🔑 Generating Android SHA1 Certificate Hash for Firebase"
echo "========================================================"
echo ""

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    echo "❌ Error: keytool not found. Please install Java JDK first."
    echo "   Download from: https://adoptium.net/"
    exit 1
fi

echo "📱 Choose your build type:"
echo "1) Debug build (development)"
echo "2) Release build (production)"
echo "3) Custom keystore"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔍 Generating SHA1 for DEBUG build..."
        echo "Using default debug keystore..."
        echo ""
        
        # Check if debug keystore exists
        if [ ! -f ~/.android/debug.keystore ]; then
            echo "❌ Debug keystore not found at ~/.android/debug.keystore"
            echo "   This usually means you haven't built an Android app yet."
            echo "   Try building your app first, or create the keystore manually."
            exit 1
        fi
        
        echo "🔑 Debug Keystore Details:"
        echo "   Path: ~/.android/debug.keystore"
        echo "   Alias: androiddebugkey"
        echo "   Password: android"
        echo ""
        
        # Generate SHA1 hash
        SHA1_HASH=$(keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep "SHA1:" | awk '{print $2}')
        
        if [ -n "$SHA1_HASH" ]; then
            echo "✅ SHA1 Hash Generated Successfully!"
            echo "   SHA1: $SHA1_HASH"
            echo ""
            echo "📋 Next Steps:"
            echo "1. Copy this SHA1 hash: $SHA1_HASH"
            echo "2. Go to Firebase Console > Project Settings > Your Apps > Android"
            echo "3. Add this SHA1 hash to your Android app configuration"
            echo "4. Update google-services.json if needed"
        else
            echo "❌ Failed to generate SHA1 hash"
            echo "   Please check your Java installation and try again"
        fi
        ;;
        
    2)
        echo ""
        echo "🔍 Generating SHA1 for RELEASE build..."
        echo ""
        
        read -p "Enter path to your release keystore (.jks or .keystore): " keystore_path
        
        if [ ! -f "$keystore_path" ]; then
            echo "❌ Keystore file not found: $keystore_path"
            exit 1
        fi
        
        read -p "Enter your keystore alias: " key_alias
        read -s -p "Enter your keystore password: " key_password
        echo ""
        
        echo ""
        echo "🔑 Release Keystore Details:"
        echo "   Path: $keystore_path"
        echo "   Alias: $key_alias"
        echo ""
        
        # Generate SHA1 hash
        SHA1_HASH=$(keytool -list -v -keystore "$keystore_path" -alias "$key_alias" -storepass "$key_password" 2>/dev/null | grep "SHA1:" | awk '{print $2}')
        
        if [ -n "$SHA1_HASH" ]; then
            echo "✅ SHA1 Hash Generated Successfully!"
            echo "   SHA1: $SHA1_HASH"
            echo ""
            echo "📋 Next Steps:"
            echo "1. Copy this SHA1 hash: $SHA1_HASH"
            echo "2. Go to Firebase Console > Project Settings > Your Apps > Android"
            echo "3. Add this SHA1 hash to your Android app configuration"
            echo "4. Update google-services.json if needed"
        else
            echo "❌ Failed to generate SHA1 hash"
            echo "   Please check your keystore details and try again"
        fi
        ;;
        
    3)
        echo ""
        echo "🔍 Custom keystore configuration..."
        echo ""
        
        read -p "Enter path to your keystore file: " keystore_path
        read -p "Enter your keystore alias: " key_alias
        read -s -p "Enter your keystore password: " key_password
        echo ""
        
        if [ ! -f "$keystore_path" ]; then
            echo "❌ Keystore file not found: $keystore_path"
            exit 1
        fi
        
        echo ""
        echo "🔑 Custom Keystore Details:"
        echo "   Path: $keystore_path"
        echo "   Alias: $key_alias"
        echo ""
        
        # Generate SHA1 hash
        SHA1_HASH=$(keytool -list -v -keystore "$keystore_path" -alias "$key_alias" -storepass "$key_password" 2>/dev/null | grep "SHA1:" | awk '{print $2}')
        
        if [ -n "$SHA1_HASH" ]; then
            echo "✅ SHA1 Hash Generated Successfully!"
            echo "   SHA1: $SHA1_HASH"
            echo ""
            echo "📋 Next Steps:"
            echo "1. Copy this SHA1 hash: $SHA1_HASH"
            echo "2. Go to Firebase Console > Project Settings > Your Apps > Android"
            echo "3. Add this SHA1 hash to your Android app configuration"
            echo "4. Update google-services.json if needed"
        else
            echo "❌ Failed to generate SHA1 hash"
            echo "   Please check your keystore details and try again"
        fi
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again and select 1, 2, or 3."
        exit 1
        ;;
esac

echo ""
echo "🔗 Firebase Console Links:"
echo "   Project Settings: https://console.firebase.google.com/project/ereft-6fd24/settings/general"
echo "   Authentication: https://console.firebase.google.com/project/ereft-6fd24/authentication"
echo ""
echo "📚 Documentation:"
echo "   Firebase Android Setup: https://firebase.google.com/docs/android/setup"
echo "   SHA1 Generation: https://developers.google.com/android/guides/client-auth"
echo ""
echo "✨ Happy coding with Firebase!"
