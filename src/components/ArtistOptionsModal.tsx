import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type ArtistOptionsModalProps = {
  visible: boolean;
  artist: {
    artistName: string;
    artistImage?: string;
    albumCount: number;
    songCount: number;
  } | null;
  onClose: () => void;
  onPlay?: () => void;
  onPlayNext?: () => void;
  onAddToQueue?: () => void;
  onAddToPlaylist?: () => void;
  onShare?: () => void;
  onGoToArtist?: () => void;
};

export function ArtistOptionsModal({
  visible,
  artist,
  onClose,
  onPlay,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
  onShare,
  onGoToArtist,
}: ArtistOptionsModalProps) {
  if (!artist) return null;

  const getArtistInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const options = [
    { icon: '▶', label: 'Play', onPress: onPlay },
    { icon: '⏭', label: 'Play Next', onPress: onPlayNext },
    { icon: '➕', label: 'Add to Playing Queue', onPress: onAddToQueue },
    { icon: '📋', label: 'Add to Playlist', onPress: onAddToPlaylist },
    { icon: '👤', label: 'Go to Artist', onPress: onGoToArtist },
    { icon: '📤', label: 'Share', onPress: onShare },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragHandle} />

          <View style={styles.artistInfo}>
            <View style={styles.artistInfoTop}>
              {artist.artistImage ? (
                <Image source={{ uri: artist.artistImage }} style={styles.artistImage} />
              ) : (
                <View style={[styles.artistImage, styles.artistImageFallback]}>
                  <Text style={styles.artistInitials}>{getArtistInitials(artist.artistName)}</Text>
                </View>
              )}
              <View style={styles.artistInfoText}>
                <Text style={styles.artistName} numberOfLines={1}>
                  {artist.artistName}
                </Text>
                <Text style={styles.artistMeta}>
                  {artist.albumCount} {artist.albumCount === 1 ? 'Album' : 'Albums'} | {artist.songCount} {artist.songCount === 1 ? 'Song' : 'Songs'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.separatorLine} />

          <View style={styles.options}>
            {options.map((option, index) => (
              <Pressable
                key={index}
                style={styles.option}
                onPress={() => {
                  option.onPress?.();
                  onClose();
                }}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
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
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textTertiary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  artistInfo: {
    marginBottom: 20,
  },
  artistInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceElevated,
    marginRight: 12,
  },
  artistImageFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInitials: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
  },
  artistInfoText: {
    flex: 1,
  },
  artistName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  artistMeta: {
    color: colors.textSecondary,
    fontSize: 14,
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
});
