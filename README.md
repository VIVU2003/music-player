🎧 SoundWave

A Modern Music Streaming Experience Built with React Native

SoundWave is a full-featured music player application designed to deliver a smooth, responsive, and intuitive listening experience.
Built using React Native + Expo, SoundWave integrates with the JioSaavn API and implements real-world music player functionality such as queue management, mini player synchronization, shuffle & repeat modes, and background playback.

This project was developed as part of a React Native internship assignment, with a strong focus on scalable architecture, clean state management, and product-level UI/UX.

✨ Key Highlights

   🎵 Real-time audio playback with global state synchronization

   🧩 Modular and scalable architecture

   🔄 Persistent queue and playback state

   🎛️ Mini player synced with full player across navigation

   ⚡ Fast search powered by JioSaavn API

🚀 Features
 
🎵 Music Playback
      Play / Pause / Next / Previous
      Seek bar with precise progress control
      Shuffle & Repeat modes (off / all / one)
      Background audio playback
      Persistent playback state across sessions
      
🔍 Discovery & Browsing
      Home (Suggested tracks)
      Songs search with real-time API results
      Artists and Albums browsing
      Global search functionality
      Bottom tab navigation

📜 Queue System
      Add tracks to queue
      Remove tracks from queue
      Drag-and-drop reordering
      Persistent queue using AsyncStorage

🎨 User Experience
      Mini player always visible during navigation
      Clean dark theme inspired by modern streaming apps
      Responsive layouts across devices
      Smooth animations and transitions
      Proper loading and empty states
      
🏗️ System Architecture

SoundWave follows a layered architecture to ensure maintainability and scalability:

UI Screens → Global State (Zustand) → Audio Engine (Expo AV) → API Layer (JioSaavn)

## 📂 Project Structure

src/
├── api/ # JioSaavn API integration
├── audio/ # Audio playback engine (Expo AV)
├── components/ # Reusable UI components
├── navigation/ # React Navigation setup
├── screens/ # App screens (Home, Player, Search, Queue, etc.)
├── state/ # Global state (Zustand + persistence)
├── theme/ # Design system & styling
├── types/ # TypeScript type definitions
└── utils/ # Helper functions

🛠️ Tech Stack
        React Native
        Expo
        TypeScript
        Zustand (State Management)
        React Navigation
        Expo AV (Audio Engine)
        AsyncStorage
        JioSaavn API

⚙️ Getting Started

1️⃣ Clone the repository
      
git clone https://github.com/VIVU2003/music-player.git

cd music-player

2️⃣ Install dependencies

npm install

3️⃣ Run the app

npx expo start

For Android:

npm run android

📦 Android APK

The Android APK was generated using Expo EAS Build.

📥 Download APK:
https://drive.google.com/file/d/1o6S51aEMF3sXpC9i8z2FAeqsBbuXoVbi/view?usp=sharing
(Note: iOS build was not generated because it requires a paid Apple Developer account.)

🔌 API Notes

   SoundWave uses an unofficial JioSaavn API.
   Due to the nature of the API:
      Search results may sometimes be fuzzy.
      Default trending data is handled internally by the app.

🧠 Design Decisions & Trade-offs

   Zustand was chosen for lightweight and scalable global state management.
   Expo AV was used for simplified audio handling in a managed Expo workflow.
   For OS-level media controls, the app can be extended using react-native-track-player.

📈 Future Enhancements

   OS-level media controls (lockscreen / notifications)
   User playlists & favorites
   Offline downloads
   Personalized recommendations
   Improved search ranking

👨‍💻 Author

Vivek Kewalramani
B.Tech Computer Science Engineering

GitHub: https://github.com/VIVU2003

⭐ Final Thoughts

SoundWave demonstrates a production-style approach to building a music streaming app with React Native.
The project emphasizes clean architecture, real-world features, and scalable design — going beyond basic assignment requirements.
