import { Audio, type AVPlaybackStatus } from 'expo-av';

type Callbacks = {
  onStatus?: (status: AVPlaybackStatus) => void;
  onDidFinish?: () => void;
};

let sound: Audio.Sound | null = null;
let callbacks: Callbacks = {};

export function setEngineCallbacks(next: Callbacks) {
  callbacks = next;
}

async function unload() {
  if (!sound) return;
  const s = sound;
  sound = null;
  try {
    await s.unloadAsync();
  } catch {

  }
}

export async function loadAndPlay(uri: string) {
  await unload();
  const created = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, progressUpdateIntervalMillis: 400, rate: 1.0, shouldCorrectPitch: true },
    (status) => {
      callbacks.onStatus?.(status);
      if (status.isLoaded && status.didJustFinish) callbacks.onDidFinish?.();
    }
  );
  sound = created.sound;
}

export async function loadAndPlayFromPath(uri: string) {
  await unload();
  const created = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, progressUpdateIntervalMillis: 400, rate: 1.0, shouldCorrectPitch: true },
    (status) => {
      callbacks.onStatus?.(status);
      if (status.isLoaded && status.didJustFinish) callbacks.onDidFinish?.();
    }
  );
  sound = created.sound;
}

export async function load(uri: string) {
  await unload();
  const created = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: false, progressUpdateIntervalMillis: 400, rate: 1.0, shouldCorrectPitch: true },
    (status) => {
      callbacks.onStatus?.(status);
      if (status.isLoaded && status.didJustFinish) callbacks.onDidFinish?.();
    }
  );
  sound = created.sound;
}

export async function play() {
  if (!sound) return;
  await sound.playAsync();
}

export async function pause() {
  if (!sound) return;
  await sound.pauseAsync();
}

export async function togglePlayPause(isPlaying: boolean) {
  if (isPlaying) return pause();
  return play();
}

export async function seekToMillis(ms: number) {
  if (!sound) return;
  await sound.setPositionAsync(ms);
}

export async function setRate(rate: number) {
  if (!sound) return;

  await sound.setRateAsync(rate, true);
}

export async function setVolume(volume: number) {
  if (!sound) return;
  const clampedVolume = Math.max(0, Math.min(1, volume));
  await sound.setVolumeAsync(clampedVolume);
}
