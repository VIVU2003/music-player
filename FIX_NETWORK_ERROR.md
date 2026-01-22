# Fix: "Failed to download remote update" Error

This error means your phone can't connect to the Expo dev server.

## Solution 1: Use Tunnel Mode (Most Reliable)

Start Expo with tunnel mode:

```bash
npm start -- --tunnel
```

Or press `s` in Expo menu, then select "tunnel"

**Pros:** Works even if phone and computer are on different networks
**Cons:** Slower connection

## Solution 2: Ensure Same WiFi Network

1. **Check your computer's IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Or on Mac: System Preferences → Network → WiFi → Advanced → TCP/IP

2. **Make sure your phone is on the SAME WiFi network** as your computer

3. **Start Expo in LAN mode:**
   ```bash
   npm start -- --lan
   ```

## Solution 3: Use LAN with Specific Host

If your computer has multiple network interfaces:

```bash
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npm start -- --lan
```

## Solution 4: Check Firewall

**On Mac:**
1. System Preferences → Security & Privacy → Firewall
2. Make sure it's not blocking Node.js or Terminal
3. Or temporarily disable firewall to test

**On Windows:**
1. Windows Defender Firewall → Allow an app
2. Allow Node.js and Terminal

## Solution 5: Manual Connection

1. Start Expo: `npm start`
2. Note the IP address shown (e.g., `exp://192.168.1.100:8081`)
3. In Expo Go app, manually enter this URL

## Quick Test

Try this command to start with tunnel (most reliable):

```bash
cd /Users/vivekkewalramani/Desktop/react-native/music-player
npx expo start --tunnel
```

Then scan the QR code again.
