import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { searchSongs, type SaavnSong } from '../api/saavn';
import { configureAudioOnce } from '../audio/configureAudio';
import * as engine from '../audio/engine';
import type { RepeatMode, Song } from '../types/music';

type PlayerState = {

  queue: Song[];
  library: Song[];
  currentIndex: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  playCounts: Record<string, number>;
  playedSongs: Record<string, Song>;
  songAddedAt: Record<string, number>;
  songPlayedAt: Record<string, number>;

  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  playbackRate: number;
  volume: number;
  lastError?: string;

  currentSong?: Song;
  mostPlayed: Song[];
  favorites: string[];
  downloadedSongs: Record<string, string>;

  initAudio: () => Promise<void>;
  setQueueAndPlay: (queue: Song[], index: number) => Promise<void>;
  playIndex: (index: number) => Promise<void>;
  loadCurrentSong: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pause: () => Promise<void>;
  next: () => Promise<void>;
  nextWithoutPlay: () => Promise<void>;
  prev: () => Promise<void>;
  seekToRatio: (ratio: number) => Promise<void>;
  seekToMillis: (ms: number) => Promise<void>;
  cyclePlaybackRate: () => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;

  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  moveInQueue: (from: number, to: number) => void;
  clearQueue: () => void;

  setShuffle: (value: boolean) => void;
  cycleRepeatMode: () => void;

  toggleFavorite: (songId: string) => void;
  isFavorite: (songId: string) => boolean;

  downloadSong: (song: Song) => Promise<void>;
  isDownloaded: (songId: string) => boolean;
  getDownloadedPath: (songId: string) => string | undefined;

  playSaavnSearchResult: (params: { query: string; page?: number; limit?: number }, pickIndex?: number) => Promise<void>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function saavnToSong(s: SaavnSong): Song {
  if (!s.streamUrl) {

    throw new Error('No stream URL for song');
  }
  return {
    id: s.id,
    title: s.title,
    artist: s.artist,
    album: s.album,
    durationSec: s.durationSec,
    artworkUrl: s.artworkUrl,
    streamUrl: s.streamUrl,
  };
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      library: [],
      currentIndex: -1,
      shuffle: false,
      repeatMode: 'off',
      playCounts: {},
      playedSongs: {},
      songAddedAt: {},
      songPlayedAt: {},

      isPlaying: false,
      positionMillis: 0,
      durationMillis: 0,
      playbackRate: 1.0,
      volume: 1.0,
      lastError: undefined,

      currentSong: undefined,
      mostPlayed: [],
      favorites: [],
      downloadedSongs: {},

      initAudio: async () => {
        await configureAudioOnce();
        engine.setEngineCallbacks({
          onStatus: (status) => {
            if (!status.isLoaded) return;
            set({
              isPlaying: status.isPlaying,
              positionMillis: status.positionMillis ?? 0,
              durationMillis: status.durationMillis ?? 0,
            });
          },
          onDidFinish: () => {
            void get().next();
          },
        });

        const { currentSong, playbackRate, volume, durationMillis } = get();
        if (currentSong && currentSong.streamUrl && durationMillis === 0) {
          try {
            await engine.load(currentSong.streamUrl);
            await engine.setRate(playbackRate);
            await engine.setVolume(volume);
          } catch (error) {

          }
        }
      },

      setQueueAndPlay: async (queue, index) => {
        const i = clamp(index, 0, Math.max(0, queue.length - 1));
        const song = queue[i];
        const now = Date.now();
        if (song) {
          const playCounts = { ...get().playCounts };
          const playedSongs = { ...get().playedSongs };
          const songAddedAt = { ...get().songAddedAt };
          const songPlayedAt = { ...get().songPlayedAt };
          const library = [...get().library];

          if (!songAddedAt[song.id]) {
            songAddedAt[song.id] = now;
          }

          if (!library.some((s) => s.id === song.id)) {
            library.push(song);
          }

          songPlayedAt[song.id] = now;

          playCounts[song.id] = (playCounts[song.id] || 0) + 1;

          playedSongs[song.id] = song;

          const mostPlayed = Object.values(playedSongs)
            .map((s) => ({ song: s, count: playCounts[s.id] || 0 }))
            .filter((item) => item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50)
            .map((item) => item.song);

          set({
            queue,
            library,
            currentIndex: queue.length ? i : -1,
            currentSong: song,
            lastError: undefined,
            playCounts,
            playedSongs,
            songAddedAt,
            songPlayedAt,
            mostPlayed,
          });
        } else {
          set({ queue, currentIndex: queue.length ? i : -1, currentSong: undefined, lastError: undefined });
        }
        if (!queue.length) return;
        const downloadedPath = get().downloadedSongs[queue[i].id];
        const uriToPlay = downloadedPath || queue[i].streamUrl;
        if (downloadedPath) {
          await engine.loadAndPlayFromPath(uriToPlay);
        } else {
          await engine.loadAndPlay(uriToPlay);
        }
        await engine.setRate(get().playbackRate);
        await engine.setVolume(get().volume);
      },

      playIndex: async (index) => {
        const { queue, library } = get();
        if (!queue.length) return;
        const i = clamp(index, 0, queue.length - 1);
        const song = queue[i];
        const now = Date.now();
        if (song) {
          const playCounts = { ...get().playCounts };
          const playedSongs = { ...get().playedSongs };
          const songAddedAt = { ...get().songAddedAt };
          const songPlayedAt = { ...get().songPlayedAt };
          const updatedLibrary = [...library];

          if (!songAddedAt[song.id]) {
            songAddedAt[song.id] = now;
          }

          if (!updatedLibrary.some((s) => s.id === song.id)) {
            updatedLibrary.push(song);
          }

          songPlayedAt[song.id] = now;

          playCounts[song.id] = (playCounts[song.id] || 0) + 1;

          playedSongs[song.id] = song;

          const mostPlayed = Object.values(playedSongs)
            .map((s) => ({ song: s, count: playCounts[s.id] || 0 }))
            .filter((item) => item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50)
            .map((item) => item.song);

          set({
            library: updatedLibrary,
            currentIndex: i,
            currentSong: song,
            lastError: undefined,
            playCounts,
            playedSongs,
            songAddedAt,
            songPlayedAt,
            mostPlayed,
          });
        } else {
          set({ currentIndex: i, currentSong: undefined, lastError: undefined });
        }
        const downloadedPath = get().downloadedSongs[queue[i].id];
        const uriToPlay = downloadedPath || queue[i].streamUrl;
        if (downloadedPath) {
          await engine.loadAndPlayFromPath(uriToPlay);
        } else {
          await engine.loadAndPlay(uriToPlay);
        }
        await engine.setRate(get().playbackRate);
        await engine.setVolume(get().volume);
      },

      loadCurrentSong: async () => {
        const { currentSong, playbackRate, volume } = get();
        if (!currentSong || !currentSong.streamUrl) return;

        if (get().durationMillis > 0) return;
        try {
          await engine.load(currentSong.streamUrl);
          await engine.setRate(playbackRate);
          await engine.setVolume(volume);
        } catch (error) {
          set({ lastError: error instanceof Error ? error.message : 'Failed to load song' });
        }
      },

      togglePlayPause: async () => {
        await engine.togglePlayPause(get().isPlaying);
      },

      pause: async () => {
        await engine.pause();
      },

      next: async () => {
        const { queue, currentIndex, shuffle, repeatMode } = get();
        if (!queue.length) return;

        if (repeatMode === 'one' && currentIndex >= 0) {
          await engine.seekToMillis(0);
          await engine.play();
          return;
        }

        let nextIndex = currentIndex + 1;
        if (shuffle) {
          nextIndex = queue.length === 1 ? 0 : Math.floor(Math.random() * queue.length);
        }

        if (nextIndex >= queue.length) {
          if (repeatMode === 'all') nextIndex = 0;
          else return;
        }

        await get().playIndex(nextIndex);
      },

      nextWithoutPlay: async () => {
        const { queue, currentIndex, shuffle, repeatMode, library } = get();
        if (!queue.length) return;

        await engine.pause();

        let nextIndex = currentIndex + 1;
        if (shuffle) {
          nextIndex = queue.length === 1 ? 0 : Math.floor(Math.random() * queue.length);
        }

        if (nextIndex >= queue.length) {
          if (repeatMode === 'all') nextIndex = 0;
          else return;
        }

        const song = queue[nextIndex];
        const now = Date.now();
        if (song) {
          const playCounts = { ...get().playCounts };
          const playedSongs = { ...get().playedSongs };
          const songAddedAt = { ...get().songAddedAt };
          const songPlayedAt = { ...get().songPlayedAt };
          const updatedLibrary = [...library];

          if (!songAddedAt[song.id]) {
            songAddedAt[song.id] = now;
          }

          if (!updatedLibrary.some((s) => s.id === song.id)) {
            updatedLibrary.push(song);
          }

          playedSongs[song.id] = song;

          const mostPlayed = Object.values(playedSongs)
            .map((s) => ({ song: s, count: playCounts[s.id] || 0 }))
            .filter((item) => item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50)
            .map((item) => item.song);

          set({
            library: updatedLibrary,
            currentIndex: nextIndex,
            currentSong: song,
            lastError: undefined,
            isPlaying: false,
            playCounts,
            playedSongs,
            songAddedAt,
            songPlayedAt,
            mostPlayed,
          });
        } else {
          set({ currentIndex: nextIndex, currentSong: undefined, lastError: undefined, isPlaying: false });
        }

        if (song && song.streamUrl) {
          await engine.load(song.streamUrl);
          await engine.setRate(get().playbackRate);
          await engine.setVolume(get().volume);
        }
      },

      prev: async () => {
        const { positionMillis, currentIndex, queue } = get();
        if (!queue.length) return;
        if (positionMillis > 3_000) {
          await engine.seekToMillis(0);
          return;
        }
        const prevIndex = clamp(currentIndex - 1, 0, queue.length - 1);
        await get().playIndex(prevIndex);
      },

      seekToRatio: async (ratio) => {
        const { durationMillis } = get();
        const r = clamp(ratio, 0, 1);
        if (!durationMillis) return;
        await engine.seekToMillis(Math.floor(durationMillis * r));
      },

      seekToMillis: async (ms) => {
        if (ms < 0) return;
        await engine.seekToMillis(ms);
      },

      cyclePlaybackRate: async () => {
        const current = get().playbackRate;
        const rates = [0.75, 1.0, 1.25, 1.5];
        const idx = Math.max(0, rates.findIndex((r) => r === current));
        const next = rates[(idx + 1) % rates.length];
        set({ playbackRate: next });
        await engine.setRate(next);
      },

      setPlaybackRate: async (rate: number) => {
        const rates = [0.75, 1.0, 1.25, 1.5];
        if (!rates.includes(rate)) return;
        set({ playbackRate: rate });
        await engine.setRate(rate);
      },

      setVolume: async (volume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ volume: clampedVolume });
        await engine.setVolume(clampedVolume);
      },

      addToQueue: (song) => {
        const { queue, currentIndex, songAddedAt } = get();
        if (queue.some((s) => s.id === song.id)) return;
        const now = Date.now();
        const updatedAddedAt = { ...songAddedAt };
        if (!updatedAddedAt[song.id]) {
          updatedAddedAt[song.id] = now;
        }
        set({
          queue: [...queue, song],
          currentIndex,
          currentSong: get().currentSong,
          songAddedAt: updatedAddedAt,
        });
      },

      removeFromQueue: (songId) => {
        const { queue, currentIndex } = get();
        const idx = queue.findIndex((s) => s.id === songId);
        if (idx < 0) return;
        const nextQueue = queue.filter((s) => s.id !== songId);
        let nextIndex = currentIndex;
        if (idx < currentIndex) nextIndex = currentIndex - 1;
        if (idx === currentIndex) nextIndex = clamp(currentIndex, 0, nextQueue.length - 1);
        set({
          queue: nextQueue,
          currentIndex: nextQueue.length ? nextIndex : -1,
          currentSong: nextQueue.length ? nextQueue[nextIndex] : undefined,
        });
      },

      moveInQueue: (from, to) => {
        const { queue, currentIndex } = get();
        if (!queue.length) return;
        const f = clamp(from, 0, queue.length - 1);
        const t = clamp(to, 0, queue.length - 1);
        if (f === t) return;
        const next = [...queue];
        const [item] = next.splice(f, 1);
        next.splice(t, 0, item);

        let nextIndex = currentIndex;
        if (currentIndex === f) nextIndex = t;
        else if (f < currentIndex && t >= currentIndex) nextIndex = currentIndex - 1;
        else if (f > currentIndex && t <= currentIndex) nextIndex = currentIndex + 1;

        set({ queue: next, currentIndex: nextIndex, currentSong: next[nextIndex] });
      },

      clearQueue: () => {
        set({
          queue: [],
          currentIndex: -1,
          currentSong: undefined,
        });
      },

      setShuffle: (value) => set({ shuffle: value }),

      cycleRepeatMode: () => {
        const cur = get().repeatMode;
        const next: RepeatMode = cur === 'off' ? 'all' : cur === 'all' ? 'one' : 'off';
        set({ repeatMode: next });
      },

      toggleFavorite: (songId) => {
        const { favorites } = get();
        const index = favorites.indexOf(songId);
        if (index >= 0) {
          const newFavorites = [...favorites];
          newFavorites.splice(index, 1);
          set({ favorites: newFavorites });
        } else {
          set({ favorites: [...favorites, songId] });
        }
      },

      isFavorite: (songId) => {
        return get().favorites.includes(songId);
      },

      downloadSong: async (song) => {
        try {
          const { FileSystem } = await import('expo-file-system');
          const fileUri = `${FileSystem.documentDirectory}${song.id}.mp3`;
          const downloadResumable = FileSystem.createDownloadResumable(song.streamUrl, fileUri);
          await downloadResumable.downloadAsync();
          const downloadedSongs = { ...get().downloadedSongs };
          downloadedSongs[song.id] = fileUri;
          set({ downloadedSongs });
        } catch (error) {
          set({ lastError: error instanceof Error ? error.message : 'Failed to download song' });
        }
      },

      isDownloaded: (songId) => {
        return !!get().downloadedSongs[songId];
      },

      getDownloadedPath: (songId) => {
        return get().downloadedSongs[songId];
      },

      playSaavnSearchResult: async (params, pickIndex = 0) => {
        try {
          const res = await searchSongs(params);
          const queue = res.results.map(saavnToSong);
          await get().setQueueAndPlay(queue, pickIndex);
        } catch (e: any) {
          set({ lastError: e?.message ?? 'Failed to play search result' });
        }
      },
    }),
    {
      name: 'player-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        queue: s.queue,
        library: s.library,
        currentIndex: s.currentIndex,
        shuffle: s.shuffle,
        repeatMode: s.repeatMode,
        playCounts: s.playCounts,
        playedSongs: s.playedSongs,
        songAddedAt: s.songAddedAt,
        songPlayedAt: s.songPlayedAt,
        favorites: s.favorites,
        downloadedSongs: s.downloadedSongs,
      }),
      onRehydrateStorage: () => (state) => {

        if (!state) return;
        const { queue, currentIndex, playCounts, playedSongs } = state as any;
        if (Array.isArray(queue) && typeof currentIndex === 'number' && queue[currentIndex]) {
          (state as any).currentSong = queue[currentIndex];
        }

        if (playedSongs && playCounts) {
          const mostPlayed = (Object.values(playedSongs) as Song[])
            .map((s) => ({ song: s, count: (playCounts as Record<string, number>)[s.id] || 0 }))
            .filter((item) => item.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50)
            .map((item) => item.song);
          (state as any).mostPlayed = mostPlayed;
        }
      },
    }
  )
);
