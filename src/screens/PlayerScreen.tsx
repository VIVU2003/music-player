import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SongOptionsModal } from '../components/SongOptionsModal';
import { usePlayerStore } from '../state/playerStore';
import { colors } from '../theme/colors';
import { formatTime } from '../utils/time';

const HEADER_HEIGHT = 56;

export function PlayerScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const song = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const volume = usePlayerStore((s) => s.volume);
  const positionMillis = usePlayerStore((s) => s.positionMillis);
  const durationMillis = usePlayerStore((s) => s.durationMillis);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const toggle = usePlayerStore((s) => s.togglePlayPause);
  const pause = usePlayerStore((s) => s.pause);
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const seekToRatio = usePlayerStore((s) => s.seekToRatio);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const queue = usePlayerStore((s) => s.queue);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setShuffle = usePlayerStore((s) => s.setShuffle);
  const cycleRepeatMode = usePlayerStore((s) => s.cycleRepeatMode);

  const [songOptionsVisible, setSongOptionsVisible] = useState(false);
  const seekToMillis = usePlayerStore((s) => s.seekToMillis);
  const loadCurrentSong = usePlayerStore((s) => s.loadCurrentSong);

  const ratio = useMemo(() => {
    if (!durationMillis) return 0;
    return Math.max(0, Math.min(1, positionMillis / durationMillis));
  }, [positionMillis, durationMillis]);

  useEffect(() => {
    if (song && song.streamUrl && durationMillis === 0) {
      void loadCurrentSong();
    }

  }, [song?.id]);

  const [seekingRatio, setSeekingRatio] = useState<number | null>(null);
  const shownRatio = seekingRatio ?? ratio;

  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    };
  }, []);

  const formatTimeMMSS = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const seekBackward10 = async () => {
    if (!durationMillis || durationMillis <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentPos = Math.max(0, positionMillis || 0);
    const newPos = Math.max(0, currentPos - 10000);
    if (newPos === currentPos && currentPos > 0) return;
    await seekToMillis(newPos);
  };

  const seekForward10 = async () => {
    if (!durationMillis || durationMillis <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentPos = Math.max(0, positionMillis || 0);
    const newPos = Math.min(durationMillis, currentPos + 10000);
    if (newPos === currentPos && currentPos < durationMillis) return;
    await seekToMillis(newPos);
  };

  const onPressSpeed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const rates = [0.75, 1.0, 1.25, 1.5];
    const currentRate = playbackRate;
    Alert.alert('Playback speed', `Current: ${currentRate}x`, [
      { text: '0.75x', onPress: () => void setPlaybackRate(0.75), style: currentRate === 0.75 ? 'default' : undefined },
      { text: '1.0x', onPress: () => void setPlaybackRate(1.0), style: currentRate === 1.0 ? 'default' : undefined },
      { text: '1.25x', onPress: () => void setPlaybackRate(1.25), style: currentRate === 1.25 ? 'default' : undefined },
      { text: '1.5x', onPress: () => void setPlaybackRate(1.5), style: currentRate === 1.5 ? 'default' : undefined },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const setSleepTimerMinutes = (minutes: number | null) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    sleepTimerRef.current = null;

    if (!minutes) {
      Alert.alert('Sleep timer', 'Off');
      return;
    }

    Alert.alert('Sleep timer', `Will stop in ${minutes} minutes`);
    sleepTimerRef.current = setTimeout(() => {
      void pause();
      sleepTimerRef.current = null;
    }, minutes * 60 * 1000);
  };

  const onPressTimer = () => {
    Alert.alert('Sleep timer', 'Choose duration', [
      { text: 'Off', onPress: () => setSleepTimerMinutes(null) },
      { text: '5 min', onPress: () => setSleepTimerMinutes(5) },
      { text: '10 min', onPress: () => setSleepTimerMinutes(10) },
      { text: '30 min', onPress: () => setSleepTimerMinutes(30) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onPressCast = () => {
    Alert.alert('Cast', 'Coming soon');
  };

  const onPressMenu = () => {

    setSongOptionsVisible(true);
  };

  if (!song) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Pick a song from Home to start playing.</Text>
      </View>
    );
  }

  return (
    <>
    <View style={styles.container}>
  {}
  <View style={[styles.content, { paddingTop: HEADER_HEIGHT + insets.top }]}>
    {}
    <View style={styles.topZone}>
      <View style={styles.artContainer}>
        {}
        <Image
          source={song.artworkUrl ? { uri: song.artworkUrl } : undefined}
          style={styles.art}
          resizeMode="cover"
        />

        {}
        <View style={[styles.artHeader, { top: insets.top + 8 }]}>
          <Pressable
            style={styles.artHeaderButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          <Pressable
            style={styles.artHeaderButton}
            onPress={() => setSongOptionsVisible(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {}
      <View style={styles.infoSection}>
        <Text numberOfLines={2} style={styles.title}>
          {song.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {song.artist}
        </Text>
      </View>
    </View>

    {}
    <View style={styles.bottomZone}>
      {}
      <View style={styles.seekSectionMoved}>
        <Slider
          value={shownRatio}
          minimumValue={0}
          maximumValue={1}
          onValueChange={(v) => setSeekingRatio(v)}
          onSlidingComplete={(v) => {
            setSeekingRatio(null);
            void seekToRatio(v);
          }}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor="rgba(255,255,255,0.12)"
          thumbTintColor={colors.primary}
          style={styles.progressSlider}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>
            {formatTimeMMSS((shownRatio * durationMillis) / 1000)}
          </Text>
          <Text style={styles.timeText}>
            {formatTimeMMSS(durationMillis / 1000)}
          </Text>
        </View>
      </View>

      {}
      <View style={styles.mainControlsRow}>
        <Pressable style={styles.secondaryButton} onPress={() => void prev()}>
          <Ionicons name="play-skip-back" size={22} color={colors.text} />
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => void seekBackward10()}
        >
          <MaterialIcons name="replay-10" size={24} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={() => void toggle()}
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.playPressed,
          ]}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={34}
            color="#000"
            style={{ marginLeft: isPlaying ? 0 : 2 }}
          />
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => void seekForward10()}
        >
          <MaterialIcons name="forward-10" size={24} color={colors.text} />
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => void next()}>
          <Ionicons name="play-skip-forward" size={22} color={colors.text} />
        </Pressable>
      </View>

      {}
      <View style={styles.additionalControlsRow}>
        <Pressable
          style={styles.miniIconButton}
          onPress={() => navigation.navigate('Queue')}
        >
          <View style={styles.queueButtonContainer}>
            <Ionicons name="list" size={22} color={colors.textSecondary} />
            {queue.length > 0 && (
              <View style={styles.queueBadge}>
                <Text style={styles.queueBadgeText}>{queue.length}</Text>
              </View>
            )}
          </View>
        </Pressable>
        <Pressable style={styles.miniIconButton} onPress={onPressSpeed}>
          <Ionicons name="speedometer-outline" size={22} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.miniIconButton} onPress={onPressTimer}>
          <Ionicons name="timer-outline" size={22} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.miniIconButton} onPress={onPressCast}>
          <Ionicons name="tv-outline" size={22} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={styles.miniIconButton} onPress={onPressMenu}>
          <Ionicons name="menu-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {}
      <View style={styles.volumeSection}>
        <Ionicons name="volume-medium" size={18} color={colors.textSecondary} />
        <Slider
          value={volume}
          minimumValue={0}
          maximumValue={1}
          onValueChange={(v) => void setVolume(v)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor="rgba(255,255,255,0.12)"
          thumbTintColor={colors.primary}
          style={styles.volumeSlider}
        />
        <Ionicons name="volume-high" size={18} color={colors.textSecondary} />
      </View>

      {}
      <View style={styles.lyricsSection}>
        <Ionicons name="chevron-up" size={16} color={colors.textSecondary} />
        <Text style={styles.lyricsText}>Lyrics</Text>
      </View>
    </View>
  </View>
</View>

      <SongOptionsModal
        visible={songOptionsVisible}
        song={song}
        onClose={() => setSongOptionsVisible(false)}
        onPlayNext={() => {
          if (song) {
            const store = usePlayerStore.getState();
            const currentIndex = store.currentIndex;
            const newQueue = [...queue];
            const insertIndex = currentIndex >= 0 ? currentIndex + 1 : queue.length;
            newQueue.splice(insertIndex, 0, song);
            void store.setQueueAndPlay(newQueue, insertIndex);
          }
        }}
        onAddToQueue={() => {
          if (song) {
            addToQueue(song);
            Alert.alert('Added to Queue', `"${song.title}" added to queue.`);
          }
        }}
        onAddToPlaylist={() => {
          Alert.alert('Add to Playlist', 'This feature is not available in this app.');
        }}
        onGoToAlbum={() => {
          if (song && song.album) {
            navigation.navigate('Album', {
              albumName: song.album,
              artistName: song.artist,
            });
          }
        }}
        onGoToArtist={() => {
          if (song) {
            navigation.navigate('Artist', { artistName: song.artist });
          }
        }}
        onDetails={() => {
          if (song) {
            Alert.alert(
              'Song Details',
              `Title: ${song.title}\nArtist: ${song.artist}\nAlbum: ${song.album || 'Unknown'}\nDuration: ${song.durationSec ? formatTime(song.durationSec) : 'Unknown'}`
            );
          }
        }}
        onSetAsRingtone={() => {
          Alert.alert('Set as Ringtone', 'This feature is not available in this app.');
        }}
        onAddToBlacklist={() => {
          Alert.alert('Add to Blacklist', 'This feature is not available in this app.');
        }}
        onShare={() => {
          if (song) {
            Alert.alert('Share', `Share "${song.title}" by ${song.artist}`);
          }
        }}
        onDeleteFromDevice={() => {
          Alert.alert('Delete from Device', 'This feature is not available in this app.');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  headerButton: {
    width: 22,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 19,
  },

  content: {
    flex: 1,
  },

  topZone: {
    flex: 1,
    justifyContent: 'center',
  },

  artContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  artHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  artHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  art: {
    width: 280,
    height: 280,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },

  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 42,
    marginBottom: 90,
  },

  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 28,
    maxWidth: '100%',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },

  bottomZone: {
    paddingBottom: 20,
  },

  seekSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 29,
  },
  seekSectionMoved: {
    marginTop: 0,
    marginBottom: 28,
    paddingHorizontal: 24,
    paddingTop: 0,
  },

  progressSlider: {
    height: 40,
  },

  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },

  timeText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },

  mainControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
  },

  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  playPressed: {
    transform: [{ scale: 0.96 }],
  },

  additionalControlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 44,
    marginBottom: 20,
  },
  miniIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  queueBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },

  volumeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
    marginBottom: 20,
  },

  volumeSlider: {
    flex: 1,
    height: 30,
  },

  lyricsSection: {
    alignItems: 'center',
    marginTop: 4,
  },

  lyricsText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
