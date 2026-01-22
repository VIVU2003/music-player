import { Audio } from 'expo-av';

let configured = false;

export async function configureAudioOnce() {
  if (configured) return;
  configured = true;
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}
