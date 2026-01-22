🎧 SoundWave — React Native Music Player

(React Native Intern Assignment)

A modern music streaming application built with React Native + Expo, featuring real-time audio playback, search and queue management.

This project integrates the unofficial JioSaavn API and focuses on clean architecture, scalable state management, and smooth UI/UX.

🔗 API Used

Music data is fetched from the JioSaavn API via:

https://saavn.sumit.co/


Docs: https://saavn.sumit.co/docs

🚀 Features Implemented
🎵 Core Player Features

Play / Pause / Next / Previous

Seek bar with progress tracking

Shuffle & Repeat modes (off / all / one)

Background audio playback

Persistent playback state

Mini player synced with full player across screens

🔍 Discovery & Navigation

Home (Suggested songs)

Songs search with API integration

Artists tab

Albums tab

Global search

Bottom navigation bar

📜 Queue Management

Add songs to queue

Remove songs from queue

Drag & reorder queue

Queue persistence using AsyncStorage

🎨 UI / UX

Responsive layouts

Clean and minimal design

Proper loading & empty states

Smooth navigation between screens

🏗️ Architecture Overview

The app follows a modular and scalable architecture:

UI Screens → Player Store (Zustand) → Audio Engine (Expo AV) → API Layer (JioSaavn)

Folder Structure
src/
 ├── api/          # API integration (JioSaavn)
 ├── audio/        # Audio playback logic
 ├── components/   # Reusable UI components
 ├── navigation/   # App navigation
 ├── screens/      # App screens
 ├── state/        # Global state management (Zustand + persist)
 ├── theme/        # Colors & styling
 ├── types/        # TypeScript types

Key Technical Choices

API Layer: src/api/saavn.ts normalizes Saavn responses into a stable internal model

State Management: Zustand with persistence (playerStore.ts)

Audio Engine: Expo AV (src/audio/*) with store as single source of truth

Navigation: React Navigation v6+

Persistence: AsyncStorage for queue & playback state

⚙️ Setup & Installation
1️⃣ Clone the repository
git clone https://github.com/VIVU2003/music-player.git
cd music-player

2️⃣ Install dependencies
npm install

3️⃣ Run the app
npx expo start


For Android:

npm run android

📦 APK Build

The Android APK was generated using Expo EAS Build.

Note: iOS build was not generated because it requires a paid Apple Developer account.

📥 APK Download Link:



📝 Notes & Trade-offs

Playback is implemented using Expo AV for simplicity within the managed Expo workflow.

For advanced OS-level media controls (lockscreen / notification controls), the app can be extended using react-native-track-player with a dev-client or prebuild workflow.

Since JioSaavn is an unofficial API, search results may sometimes be fuzzy or approximate.

✨ Bonus Features

Shuffle & repeat modes

Mini player synced globally

Queue reorder & persistence

Modular scalable architecture

Spotify-like UI enhancements

📌 Key Learnings

Designing scalable React Native architecture

Managing global audio state with Zustand

Handling async API data and edge cases

Building responsive and modern UI

Implementing real-world music player features

👨‍💻 Developed By

Vivek Kewalramani
B.Tech Computer Science Engineering

GitHub: https://github.com/VIVU2003

⭐ Final Note

This project was built with a focus on clean code, modular design, and real-world app behavior, going beyond basic assignment requirements.
