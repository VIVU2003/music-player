import { useNavigation, useRoute } from '@react-navigation/native';
import { useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ArtistOptionsModal } from '../components/ArtistOptionsModal';
import { SongOptionsModal } from '../components/SongOptionsModal';
import { usePlayerStore } from '../state/playerStore';
import { colors } from '../theme/colors';
import type { Song } from '../types/music';
import { formatTime } from '../utils/time';

export function ArtistDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { artistName } = route.params || {};

  const setQueueAndPlay = usePlayerStore((s) => s.setQueueAndPlay);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const library = usePlayerStore((s) => s.library);
  const queue = usePlayerStore((s) => s.queue);
  const playCounts = usePlayerStore((s) => s.playCounts);

  const [artistOptionsVisible, setArtistOptionsVisible] = useState(false);
  const [songOptionsVisible, setSongOptionsVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const normalizeArtistName = (name: string): string => {
    return name.trim().toLowerCase();
  };

  const songMatchesArtist = (songArtist: string, searchedArtist: string): boolean => {
    if (!songArtist || !searchedArtist) return false;

    const normalizedSongArtist = normalizeArtistName(songArtist);
    const normalizedSearchedArtist = normalizeArtistName(searchedArtist);

    if (normalizedSongArtist === normalizedSearchedArtist) return true;

    const separators = /[,&]|feat\.?|ft\.?|with|and/i;
    const artistParts = normalizedSongArtist.split(separators).map(part => part.trim());

    return artistParts.some(part => part === normalizedSearchedArtist);
  };

  const artistSongs = useMemo(() => {
    if (!artistName) return [];

    const librarySongs = library.filter((s) =>
      s.artist && songMatchesArtist(s.artist, artistName)
    );

    const librarySongIds = new Set(librarySongs.map(s => s.id));
    const queueSongs = queue.filter((s) =>
      s.artist && songMatchesArtist(s.artist, artistName) && !librarySongIds.has(s.id)
    );

    const allArtistSongs = [...librarySongs, ...queueSongs];

    const uniqueSongs = new Map<string, Song>();
    allArtistSongs.forEach((song) => {
      if (!uniqueSongs.has(song.id)) {
        uniqueSongs.set(song.id, song);
      }
    });

    return Array.from(uniqueSongs.values());
  }, [library, queue, artistName]);

  const stats = useMemo(() => {
    const albums = new Set<string>();
    let totalDurationSec = 0;

    artistSongs.forEach((song) => {
      if (song.album) albums.add(song.album);
      if (song.durationSec) totalDurationSec += song.durationSec;
    });

    const albumCount = albums.size;
    const songCount = artistSongs.length;

    const hours = Math.floor(totalDurationSec / 3600);
    const minutes = Math.floor((totalDurationSec % 3600) / 60);
    const seconds = Math.floor(totalDurationSec % 60);
    const totalDuration = hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return { albumCount, songCount, totalDuration };
  }, [artistSongs]);

  const artistImage = useMemo(() => {
    if (artistSongs.length === 0) return undefined;

    let bestSong = artistSongs[0];
    let maxPlayCount = playCounts[bestSong.id] || 0;

    artistSongs.forEach((song) => {
      const playCount = playCounts[song.id] || 0;
      if (playCount > maxPlayCount && song.artworkUrl) {
        maxPlayCount = playCount;
        bestSong = song;
      }
    });

    return bestSong.artworkUrl || artistSongs[0]?.artworkUrl;
  }, [artistSongs, playCounts]);

  const handleShuffle = () => {
    if (artistSongs.length > 0) {

      const shuffled = [...artistSongs].sort(() => Math.random() - 0.5);
      void setQueueAndPlay(shuffled, 0);
      navigation.navigate('Player');
    }
  };

  const handlePlay = () => {
    if (artistSongs.length > 0) {
      void setQueueAndPlay(artistSongs, 0);
      navigation.navigate('Player');
    }
  };

  if (!artistName || artistSongs.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerRight}>
            <Pressable style={styles.searchButton}>
              <Ionicons name="search" size={22} color={colors.text} />
            </Pressable>
            <Pressable
              style={styles.moreButton}
              onPress={() => setArtistOptionsVisible(true)}
            >
              <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No songs found for this artist</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable style={styles.searchButton}>
            <Ionicons name="search" size={22} color={colors.text} />
          </Pressable>
          <Pressable style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.artContainer}>
        {artistImage ? (
          <Image source={{ uri: artistImage }} style={styles.art} />
        ) : (
          <View style={[styles.art, styles.artFallback]}>
            <Text style={styles.artFallbackText}>
              {artistName.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.artistName}>{artistName}</Text>
        <Text style={styles.stats}>
          {stats.albumCount} {stats.albumCount === 1 ? 'Album' : 'Albums'} | {stats.songCount} {stats.songCount === 1 ? 'Song' : 'Songs'} | {stats.totalDuration} mins
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <Pressable onPress={handleShuffle} style={styles.shuffleButton}>
          <Ionicons name="shuffle" size={20} color={colors.text} />
          <Text style={styles.buttonText}>Shuffle</Text>
        </Pressable>
        <Pressable onPress={handlePlay} style={styles.playButton}>
          <Ionicons name="play" size={16} color={colors.primary} />
          <Text style={styles.buttonText}>Play</Text>
        </Pressable>
      </View>

      <View style={styles.songsSection}>
        <View style={styles.songsHeader}>
          <Text style={styles.songsTitle}>Songs</Text>
          <Pressable
            onPress={() => {

              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }}
          >
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        {artistSongs.map((song, index) => (
          <Pressable
            key={song.id}
            style={styles.songItem}
            onPress={() => {
              void setQueueAndPlay(artistSongs, index);
              navigation.navigate('Player');
            }}
          >
            {song.artworkUrl ? (
              <Image source={{ uri: song.artworkUrl }} style={styles.songArt} />
            ) : (
              <View style={[styles.songArt, styles.songArtFallback]}>
                <Text style={styles.songArtFallbackText}>♪</Text>
              </View>
            )}
            <View style={styles.songInfo}>
              <Text numberOfLines={1} style={styles.songTitle}>
                {song.title}
              </Text>
              <Text numberOfLines={1} style={styles.songArtist}>
                {song.artist}
              </Text>
            </View>
            <Pressable
              style={styles.songPlayButton}
              onPress={(e) => {
                e.stopPropagation();
                void setQueueAndPlay(artistSongs, index);
                navigation.navigate('Player');
              }}
            >
              <Ionicons name="play" size={12} color={colors.text} />
            </Pressable>
            <Pressable
              style={styles.songMoreButton}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedSong(song);
                setSongOptionsVisible(true);
              }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
            </Pressable>
          </Pressable>
        ))}
      </View>

      <ArtistOptionsModal
        visible={artistOptionsVisible}
        artist={{
          artistName,
          artistImage,
          albumCount: stats.albumCount,
          songCount: stats.songCount,
        }}
        onClose={() => setArtistOptionsVisible(false)}
        onPlay={handlePlay}
        onPlayNext={() => {
          if (artistSongs.length > 0) {
            const store = usePlayerStore.getState();
            const currentIndex = store.currentIndex;
            const queue = store.queue;
            const newQueue = [...queue];
            const insertIndex = currentIndex >= 0 ? currentIndex + 1 : queue.length;
            newQueue.splice(insertIndex, 0, ...artistSongs);
            void store.setQueueAndPlay(newQueue, insertIndex);
            navigation.navigate('Player');
          }
        }}
        onAddToQueue={() => {
          if (artistSongs.length > 0) {
            artistSongs.forEach((song) => addToQueue(song));
            Alert.alert('Added to Queue', `Added ${artistSongs.length} song${artistSongs.length === 1 ? '' : 's'} by ${artistName} to queue.`);
          }
        }}
        onAddToPlaylist={() => {
          Alert.alert('Add to Playlist', 'This feature is not available in this app.');
        }}
        onGoToArtist={() => {

        }}
        onShare={() => {
          Alert.alert('Share', `Share "${artistName}"`);
        }}
      />

      <SongOptionsModal
        visible={songOptionsVisible}
        song={selectedSong}
        onClose={() => {
          setSongOptionsVisible(false);
          setSelectedSong(null);
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
        onAddToQueue={() => {
          if (selectedSong) {
            addToQueue(selectedSong);
            Alert.alert('Added to Queue', `"${selectedSong.title}" added to queue.`);
          }
        }}
        onAddToPlaylist={() => {
          Alert.alert('Add to Playlist', 'This feature is not available in this app.');
        }}
        onGoToAlbum={() => {
          if (selectedSong && selectedSong.album) {
            navigation.navigate('Album', {
              albumName: selectedSong.album,
              artistName: selectedSong.artist,
            });
          }
        }}
        onGoToArtist={() => {
          if (selectedSong) {
            navigation.navigate('Artist', { artistName: selectedSong.artist });
          }
        }}
        onDetails={() => {
          if (selectedSong) {
            Alert.alert(
              'Song Details',
              `Title: ${selectedSong.title}\nArtist: ${selectedSong.artist}\nAlbum: ${selectedSong.album || 'Unknown'}\nDuration: ${selectedSong.durationSec ? formatTime(selectedSong.durationSec) : 'Unknown'}`
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
          if (selectedSong) {
            Alert.alert('Share', `Share "${selectedSong.title}" by ${selectedSong.artist}`);
          }
        }}
        onDeleteFromDevice={() => {
          Alert.alert('Delete from Device', 'This feature is not available in this app.');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  artContainer: {
    width: '100%',
    aspectRatio: 1,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  art: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  artFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artFallbackText: {
    color: '#000',
    fontSize: 48,
    fontWeight: '700',
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  artistName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  stats: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  shuffleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    gap: 8,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
    gap: 8,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  songsSection: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  songsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  songsTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  seeAll: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
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
  songArtFallback: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songArtFallbackText: {
    color: colors.textSecondary,
    fontSize: 24,
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
  songPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  songMoreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
