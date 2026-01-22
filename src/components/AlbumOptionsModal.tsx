import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type AlbumOptionsModalProps = {
  visible: boolean;
  album: {
    albumId: string;
    albumName: string;
    albumArtist: string;
    albumArt?: string;
    songCount: number;
  } | null;
  onClose: () => void;
  onPlay?: () => void;
  onShuffle?: () => void;
  onAddToPlaylist?: () => void;
  onGoToArtist?: () => void;
};

export function AlbumOptionsModal({
  visible,
  album,
  onClose,
  onPlay,
  onShuffle,
  onAddToPlaylist,
  onGoToArtist,
}: AlbumOptionsModalProps) {
  if (!album) return null;

  const getAlbumInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const options = [
    { icon: '▶', label: 'Play', onPress: onPlay },
    { icon: '🔀', label: 'Shuffle', onPress: onShuffle },
    { icon: '📋', label: 'Add to Playlist', onPress: onAddToPlaylist },
    { icon: '👤', label: 'Go to Artist', onPress: onGoToArtist },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragHandle} />

          <View style={styles.albumInfo}>
            <View style={styles.albumInfoTop}>
              {album.albumArt ? (
                <Image source={{ uri: album.albumArt }} style={styles.albumImage} />
              ) : (
                <View style={[styles.albumImage, styles.albumImageFallback]}>
                  <Text style={styles.albumInitials}>{getAlbumInitials(album.albumName)}</Text>
                </View>
              )}
              <View style={styles.albumInfoText}>
                <Text style={styles.albumName} numberOfLines={1}>
                  {album.albumName}
                </Text>
                <Text style={styles.albumMeta}>
                  {album.albumArtist} | {album.songCount} {album.songCount === 1 ? 'Song' : 'Songs'}
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
  albumInfo: {
    marginBottom: 20,
  },
  albumInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    marginRight: 12,
  },
  albumImageFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumInitials: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
  },
  albumInfoText: {
    flex: 1,
  },
  albumName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  albumMeta: {
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
