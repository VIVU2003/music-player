import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SongOptionsModal } from '../components/SongOptionsModal';
import { usePlayerStore } from '../state/playerStore';
import { colors } from '../theme/colors';
import type { Song } from '../types/music';
import { formatTime } from '../utils/time';

export function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const favorites = usePlayerStore((s) => s.favorites);
  const library = usePlayerStore((s) => s.library);
  const setQueueAndPlay = usePlayerStore((s) => s.setQueueAndPlay);
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite);
  const [songOptionsVisible, setSongOptionsVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const favoriteSongs = useMemo(() => {
    return library.filter((song) => favorites.includes(song.id));
  }, [library, favorites]);

  if (favoriteSongs.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Favorites</Text>
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>Tap the heart icon on any song to add it to favorites</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.count}>{favoriteSongs.length} {favoriteSongs.length === 1 ? 'song' : 'songs'}</Text>
      </View>
      <FlatList
        data={favoriteSongs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.songItem}
            onPress={() => {
              void setQueueAndPlay(favoriteSongs, index);
              navigation.navigate('Player');
            }}
          >
            <Image source={{ uri: item.artworkUrl }} style={styles.songArt} />
            <View style={styles.songInfo}>
              <Text numberOfLines={1} style={styles.songTitle}>
                {item.title}
              </Text>
              <Text numberOfLines={1} style={styles.songArtist}>
                {item.artist} {item.durationSec ? `| ${formatTime(item.durationSec)} mins` : ''}
              </Text>
            </View>
            <Pressable
              style={styles.playButton}
              onPress={(e) => {
                e.stopPropagation();
                void setQueueAndPlay(favoriteSongs, index);
                navigation.navigate('Player');
              }}
            >
              <Text style={styles.playIcon}>▶</Text>
            </Pressable>
            <Pressable
              style={styles.favoriteButton}
              onPress={(e) => {
                e.stopPropagation();
                toggleFavorite(item.id);
              }}
            >
              <Ionicons
                name="heart"
                size={22}
                color={colors.primary}
              />
            </Pressable>
            <Pressable
              style={styles.moreButton}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedSong(item);
                setSongOptionsVisible(true);
              }}
            >
              <Text style={styles.moreIcon}>⋮</Text>
            </Pressable>
          </Pressable>
        )}
      />
      <SongOptionsModal
        visible={songOptionsVisible}
        song={selectedSong}
        onClose={() => {
          setSongOptionsVisible(false);
          setSelectedSong(null);
        }}
        onAddToQueue={() => {
          if (selectedSong) {
            usePlayerStore.getState().addToQueue(selectedSong);
          }
        }}
        onGoToArtist={() => {
          if (selectedSong) {
            navigation.navigate('Artist', { artistId: selectedSong.artist, artistName: selectedSong.artist });
          }
        }}
        onGoToAlbum={() => {
          if (selectedSong && selectedSong.album) {
            navigation.navigate('Album', {
              albumId: selectedSong.album,
              albumName: selectedSong.album,
              artistName: selectedSong.artist,
            });
          }
        }}
        onPlayNext={() => {
          if (selectedSong) {
            const store = usePlayerStore.getState();
            const currentIndex = store.currentIndex;
            const queue = store.queue;
            const newQueue = [...queue];
            const insertIndex = currentIndex >= 0 ? currentIndex + 1 : queue.length;
            newQueue.splice(insertIndex, 0, selectedSong);
            void store.setQueueAndPlay(newQueue, insertIndex);
            navigation.navigate('Player');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  count: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 160,
    paddingHorizontal: 20,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  songArt: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  songArtist: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playIcon: {
    color: colors.text,
    fontSize: 12,
    marginLeft: 2,
  },
  favoriteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
});
