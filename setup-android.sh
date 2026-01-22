#!/bin/bash

echo "🔧 Android SDK Setup Script"
echo "=========================="
echo ""

# Check if Android Studio is installed
if [ -d "/Applications/Android Studio.app" ]; then
    echo "✅ Android Studio found"
else
    echo "❌ Android Studio not found"
    echo ""
    echo "Please install Android Studio first:"
    echo "1. Download from: https://developer.android.com/studio"
    echo "2. Install and open Android Studio"
    echo "3. Complete the setup wizard (it will install Android SDK)"
    echo "4. Then run this script again"
    exit 1
fi

# Check if SDK exists
if [ -d "$HOME/Library/Android/sdk" ]; then
    echo "✅ Android SDK found at: $HOME/Library/Android/sdk"
else
    echo "❌ Android SDK not found"
    echo "Please open Android Studio and complete the setup wizard"
    exit 1
fi

# Add to .zshrc
ZSHRC="$HOME/.zshrc"
BACKUP="$ZSHRC.backup.$(date +%s)"

echo ""
echo "📝 Adding Android SDK to your shell configuration..."

# Backup existing .zshrc
if [ -f "$ZSHRC" ]; then
    cp "$ZSHRC" "$BACKUP"
    echo "✅ Backed up existing .zshrc to $BACKUP"
fi

# Check if already configured
if grep -q "ANDROID_HOME" "$ZSHRC" 2>/dev/null; then
    echo "⚠️  Android SDK already configured in .zshrc"
    echo "   You may need to run: source ~/.zshrc"
else
    cat >> "$ZSHRC" << 'EOF'

# Android SDK Configuration
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
EOF
    echo "✅ Added Android SDK configuration to .zshrc"
fi

echo ""
echo "🔄 Reloading shell configuration..."
source "$ZSHRC" 2>/dev/null || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify installation: adb version"
echo "2. Start Expo: npm start"
echo "3. Press 'a' for Android emulator"
echo ""
echo "If 'adb' command not found, run: source ~/.zshrc"
