# Android Setup Guide

## Option 1: Use Expo Go (Easiest - No Android SDK needed)

1. **Install Expo Go** on your Android phone from Google Play Store
2. **Start the dev server:**
   ```bash
   npm start
   ```
3. **Scan the QR code** that appears in the terminal with:
   - **Android**: Use the Expo Go app to scan the QR code
   - Or press `a` in the terminal (but this requires Android SDK - see Option 2)

## Option 2: Install Android Studio (For building APK or using emulator)

### Step 1: Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio and go through the setup wizard
4. It will automatically install Android SDK

### Step 2: Set up Environment Variables
Add these to your `~/.zshrc` (or `~/.bash_profile` if using bash):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload:
```bash
source ~/.zshrc
```

### Step 3: Verify Installation
```bash
adb version
```

### Step 4: Create Android Emulator (Optional)
1. Open Android Studio
2. Tools → Device Manager
3. Create Virtual Device
4. Choose a device (e.g., Pixel 5)
5. Download a system image (e.g., Android 13)
6. Finish setup

### Step 5: Run on Android
```bash
npm start
# Then press 'a' for Android emulator
# Or connect your phone via USB and enable USB debugging
```

## For Building APK (Submission)

Use EAS Build (recommended):
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Or build locally (requires Android Studio):
```bash
npx expo run:android --variant release
```
