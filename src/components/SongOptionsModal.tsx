import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePlayerStore } from '../state/playerStore';
import { colors } from '../theme/colors';
import type { Song } from '../types/music';
import { formatTime } from '../utils/time';

type SongOptionsModalProps = {
  visible: boolean;
  song: Song | null;
  onClose: () => void;
  onPlayNext?: () => void;
  onAddToQueue?: () => void;
  onAddToPlaylist?: () => void;
  onGoToAlbum?: () => void;
  onGoToArtist?: () => void;
  onDetails?: () => void;
  onSetAsRingtone?: () => void;
  onAddToBlacklist?: () => void;
  onShare?: () => void;
  onDeleteFromDevice?: () => void;
};

export function SongOptionsModal({
  visible,
  song,
  onClose,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
  onGoToAlbum,
  onGoToArtist,
  onDetails,
  onSetAsRingtone,
  onAddToBlacklist,
  onShare,
  onDeleteFromDevice,
}: SongOptionsModalProps) {
  const favorites = usePlayerStore((s) => s.favorites);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const downloadSong = usePlayerStore((s) => s.downloadSong);
  const isDownloaded = usePlayerStore((s) => s.isDownloaded);
  const [downloading, setDownloading] = useState(false);

  const favorite = useMemo(() => {
    if (!song) return false;
    return favorites.includes(song.id);
  }, [favorites, song?.id]);

  const downloaded = useMemo(() => {
    if (!song) return false;
    return isDownloaded(song.id);
  }, [isDownloaded, song?.id]);

  const handleToggleFavorite = () => {
    if (!song) return;
    toggleFavorite(song.id);
  };

  const handleDownload = async () => {
    if (!song) return;
    if (downloaded) {
      Alert.alert('Already Downloaded', 'This song is already downloaded for offline listening.');
      return;
    }
    setDownloading(true);
    try {
      await downloadSong(song);
      Alert.alert('Download Complete', `"${song.title}" has been downloaded for offline listening.`);
    } catch (error) {
      Alert.alert('Download Failed', error instanceof Error ? error.message : 'Failed to download song.');
    } finally {
      setDownloading(false);
    }
  };

  if (!song) return null;

  const options = [
    { icon: '⏭', label: 'Play Next', onPress: onPlayNext },
    { icon: '➕', label: 'Add to Playing Queue', onPress: onAddToQueue },
    { icon: '📋', label: 'Add to Playlist', onPress: onAddToPlaylist },
    {
      icon: downloaded ? '✓' : '⬇️',
      label: downloaded ? 'Downloaded' : 'Download for Offline',
      onPress: handleDownload,
      disabled: downloading || downloaded,
    },
    { icon: '▶', label: 'Go to Album', onPress: onGoToAlbum },
    { icon: '👤', label: 'Go to Artist', onPress: onGoToArtist },
    { icon: 'ℹ️', label: 'Details', onPress: onDetails },
    { icon: '📞', label: 'Set as Ringtone', onPress: onSetAsRingtone },
    { icon: '🚫', label: 'Add to Blacklist', onPress: onAddToBlacklist },
    { icon: '📤', label: 'Share', onPress: onShare },
    { icon: '🗑️', label: 'Delete from Device', onPress: onDeleteFromDevice },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragHandle} />

          <View style={styles.songInfo}>
            <View style={styles.songInfoTop}>
              <Image source={{ uri: song.artworkUrl }} style={styles.albumArt} />
              <View style={styles.songInfoText}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <View style={styles.songMeta}>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {song.artist}
                  </Text>
                  {song.durationSec && (
                    <>
                      <Text style={styles.separator}>|</Text>
                      <Text style={styles.duration}>
                        {(() => {
                          const totalSeconds = Math.floor(song.durationSec);
                          const minutes = Math.floor(totalSeconds / 60);
                          const seconds = totalSeconds % 60;
                          return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} mins`;
                        })()}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <Pressable
                style={styles.favoriteButton}
                onPress={handleToggleFavorite}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={favorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={favorite ? colors.primary : colors.text}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.separatorLine} />

          <View style={styles.options}>
            {options.map((option, index) => (
              <Pressable
                key={index}
                style={[styles.option, (option as any).disabled && styles.optionDisabled]}
                onPress={() => {
                  if (!(option as any).disabled) {
                    option.onPress?.();
                    if (!downloading) {
                      onClose();
                    }
                  }
                }}
                disabled={(option as any).disabled}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
                {downloading && option.label === 'Download for Offline' && (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.downloadSpinner} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textTertiary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  songInfo: {
    marginBottom: 20,
  },
  songInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumArt: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    marginRight: 12,
  },
  songInfoText: {
    flex: 1,
  },
  songTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  songArtist: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  separator: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorLine: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 8,
  },
  options: {
    gap: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  optionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  downloadSpinner: {
    marginLeft: 'auto',
  },
});
