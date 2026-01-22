# Build Instructions for Music Player App

This guide will help you build your app for both Android (APK) and iOS (IPA).

## Prerequisites

1. **Expo Account**: You need a free Expo account
2. **For iOS builds**: Apple Developer Account (required for device testing and App Store)
3. **For Android builds**: No special account needed for APK builds

## Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
npx eas-cli login
```

This will open a browser window for you to log in with your Expo account (or create one if you don't have it).

## Step 3: Configure Your Project

The `eas.json` file is already configured with:
- **Preview builds**: For testing (APK for Android, IPA for iOS)
- **Production builds**: For release (APK for Android, IPA for iOS)

## Step 4: Build for Android (APK)

### Preview Build (for testing):
```bash
npx eas-cli build --platform android --profile preview
```

### Production Build (for release):
```bash
npx eas-cli build --platform android --profile production
```

**Note**: The APK will be available for download from the Expo dashboard after the build completes (usually 10-20 minutes).

## Step 5: Build for iOS (IPA)

### Preview Build (for testing):
```bash
npx eas-cli build --platform ios --profile preview
```

### Production Build (for release):
```bash
npx eas-cli build --platform ios --profile production
```

**Important for iOS**:
- First-time iOS builds require an Apple Developer account
- You'll be prompted to set up credentials during the first build
- The IPA file will be available for download from the Expo dashboard

## Step 6: Build for Both Platforms Simultaneously

You can build for both platforms at once:

```bash
npx eas-cli build --platform all --profile preview
```

or for production:

```bash
npx eas-cli build --platform all --profile production
```

## Build Options

### Local Builds (Faster, but requires local setup)

For Android:
```bash
npx eas-cli build --platform android --profile preview --local
```

For iOS (requires macOS with Xcode):
```bash
npx eas-cli build --platform ios --profile preview --local
```

### View Build Status

```bash
npx eas-cli build:list
```

### Download Builds

After builds complete, you can:
1. Download from the Expo dashboard: https://expo.dev
2. Or use the download link provided in the terminal

## Troubleshooting

### If you get "Not logged in" error:
```bash
npx eas-cli login
```

### If iOS build fails due to credentials:
- First build will guide you through credential setup
- Or configure manually: `npx eas-cli credentials`

### If you need to update app version:
Edit `app.json` and update the `version` field, then rebuild.

## Quick Start Commands

**Android APK (Preview)**:
```bash
npx eas-cli login && npx eas-cli build --platform android --profile preview
```

**iOS IPA (Preview)**:
```bash
npx eas-cli login && npx eas-cli build --platform ios --profile preview
```

**Both Platforms (Preview)**:
```bash
npx eas-cli login && npx eas-cli build --platform all --profile preview
```

## Build Time

- **Android APK**: ~10-15 minutes
- **iOS IPA**: ~15-20 minutes (first build may take longer due to credential setup)
- **Both platforms**: ~20-30 minutes

## Next Steps After Build

1. **Android**: Install the APK on any Android device by downloading and opening the file
2. **iOS**: Install the IPA using:
   - TestFlight (for distribution)
   - Xcode (for direct device installation)
   - Or use the Expo dashboard download link

---

**Note**: APK files are Android-specific. For iOS, you get IPA files. Both are installable on their respective platforms.
