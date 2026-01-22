# Music Player (React Native Intern Assignment)

Music streaming app using the **JioSaavn API** via `https://saavn.sumit.co/` ([docs](https://saavn.sumit.co/docs)).

## Setup

```bash
cd music-player
npm install
npm run android
```

## What’s implemented

- **Home**: search + infinite scroll pagination via `/api/search/songs`
- **Player**: play/pause, next/prev, seek bar, shuffle + repeat (off/all/one)
- **Mini Player**: persistent bar synced with full player across navigation
- **Queue**: reorder (drag), remove; queue is persisted locally (AsyncStorage)
- **Background playback**: configured via Expo AV + `UIBackgroundModes: ["audio"]`

## Architecture (high level)

- **API**: `src/api/saavn.ts` normalizes Saavn responses into a stable model
- **State**: `src/state/playerStore.ts` (Zustand + persist)
- **Audio engine**: `src/audio/*` (Expo AV Sound), store stays the single source of truth for UI sync
- **Navigation**: `src/navigation/*` (React Navigation v6+)

## Notes / Trade-offs

- Playback uses **Expo AV** for simplicity in managed Expo. If you need OS-level media controls (notification/lockscreen controls), the typical upgrade is `react-native-track-player` + dev-client/prebuild.

