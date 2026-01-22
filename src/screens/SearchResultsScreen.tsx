import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { searchAlbums, searchArtists, searchSongs, type SaavnAlbum, type SaavnArtist } from '../api/saavn';
import { SongOptionsModal } from '../components/SongOptionsModal';
import { usePlayerStore } from '../state/playerStore';
import { colors } from '../theme/colors';
import type { Song } from '../types/music';
import { formatTime } from '../utils/time';

type Category = 'Songs' | 'Artists' | 'Albums' | 'Folders';

function isValidSearchResult(query: string, title: string, artist: string): boolean {

  const normalizedQuery = query.toLowerCase().trim();
  const normalizedTitle = title.toLowerCase().trim();
  const normalizedArtist = artist.toLowerCase().trim();

  if (!normalizedQuery) return false;

  if (normalizedTitle.startsWith(normalizedQuery)) return true;

  if (normalizedArtist.startsWith(normalizedQuery)) return true;

  if (normalizedTitle.includes(` ${normalizedQuery}`) || normalizedTitle.includes(`${normalizedQuery} `)) {
    return true;
  }

  if (normalizedArtist.includes(` ${normalizedQuery}`) || normalizedArtist.includes(`${normalizedQuery} `)) {
    return true;
  }

  return false;
}

export function SearchResultsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { query, category = 'Songs' } = route.params || {};
  const setQueueAndPlay = usePlayerStore((s) => s.setQueueAndPlay);

  const [activeCategory, setActiveCategory] = useState<Category>(category);
  const [loading, setLoading] = useState(false);
  const [songResults, setSongResults] = useState<Song[]>([]);
  const [artistResults, setArtistResults] = useState<SaavnArtist[]>([]);
  const [albumResults, setAlbumResults] = useState<SaavnAlbum[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [songOptionsVisible, setSongOptionsVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const categories: Category[] = ['Songs', 'Artists', 'Albums', 'Folders'];

  useEffect(() => {
    if (query) {
      void performSearch();
    }
  }, [query, activeCategory]);

  async function performSearch() {
    if (!query || query.trim().length < 2) {
      setSongResults([]);
      setArtistResults([]);
      setAlbumResults([]);
      setNotFound(false);
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);
      const searchQuery = query.trim();

      if (activeCategory === 'Songs') {
        const res = await searchSongs({ query: searchQuery, page: 1, limit: 50 });
        const songs: Song[] = res.results
          .filter((s) => s.streamUrl)
          .map((s) => ({
            id: s.id,
            title: s.title,
            artist: s.artist,
            album: s.album,
            durationSec: s.durationSec,
            artworkUrl: s.artworkUrl,
            streamUrl: s.streamUrl!,
          }))
          .filter((s) => isValidSearchResult(searchQuery, s.title, s.artist));
        setSongResults(songs);
        setNotFound(songs.length === 0);
      } else if (activeCategory === 'Artists') {
        const res = await searchArtists({ query: searchQuery, page: 1, limit: 50 });
        const validArtists = res.results.filter((a) =>
          isValidSearchResult(searchQuery, a.name, '')
        );
        setArtistResults(validArtists);
        setNotFound(validArtists.length === 0);
      } else if (activeCategory === 'Albums') {
        const res = await searchAlbums({ query: searchQuery, page: 1, limit: 50 });
        const validAlbums = res.results.filter((a) =>
          isValidSearchResult(searchQuery, a.name, a.artist)
        );
        setAlbumResults(validAlbums);
        setNotFound(validAlbums.length === 0);
      } else {

        setSongResults([]);
        setArtistResults([]);
        setAlbumResults([]);
        setNotFound(true);
      }
    } catch (error) {
      setSongResults([]);
      setArtistResults([]);
      setAlbumResults([]);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  const showNotFound = notFound && !loading && (
    (activeCategory === 'Songs' && songResults.length === 0) ||
    (activeCategory === 'Artists' && artistResults.length === 0) ||
    (activeCategory === 'Albums' && albumResults.length === 0) ||
    activeCategory === 'Folders'
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>{query}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.clearButton}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.categoryTabs}>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
          >
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : showNotFound ? (
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundEmoji}>😢</Text>
          <Text style={styles.notFoundTitle}>Not Found</Text>
          <Text style={styles.notFoundText}>
            Sorry, the keyword you entered cannot be found, please check again or search with another keyword.
          </Text>
        </View>
      ) : activeCategory === 'Songs' && songResults.length > 0 ? (
        <FlatList
          data={songResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Pressable
              style={styles.songItem}
              onPress={() => {
                void setQueueAndPlay(songResults, index);
              }}
            >
              {item.artworkUrl ? (
                <Image source={{ uri: item.artworkUrl }} style={styles.songArt} />
              ) : (
                <View style={[styles.songArt, styles.songArtFallback]}>
                  <Text style={styles.songArtFallbackText}>♪</Text>
                </View>
              )}
              <View style={styles.songInfo}>
                <Text numberOfLines={1} style={styles.songTitle}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={styles.songArtist}>
                  {item.artist}
                </Text>
              </View>
              <Pressable
                style={styles.playButton}
                onPress={(e) => {
                  e.stopPropagation();
                  void setQueueAndPlay(songResults, index);
                }}
              >
                <Text style={styles.playIcon}>▶</Text>
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
      ) : activeCategory === 'Artists' && artistResults.length > 0 ? (
        <FlatList
          data={artistResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.artistItem}
              onPress={() => {
                navigation.navigate('Artist', { artistName: item.name });
              }}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.artistImage} />
              ) : (
                <View style={[styles.artistImage, styles.artistImageFallback]}>
                  <Text style={styles.artistInitials}>
                    {item.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.artistInfo}>
                <Text numberOfLines={1} style={styles.artistName}>
                  {item.name}
                </Text>
                {item.followers && (
                  <Text style={styles.artistFollowers}>
                    {item.followers.toLocaleString()} followers
                  </Text>
                )}
              </View>
            </Pressable>
          )}
        />
      ) : activeCategory === 'Albums' && albumResults.length > 0 ? (
        <FlatList
          data={albumResults}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.albumRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.albumItem}
              onPress={() => {
                navigation.navigate('Album', {
                  albumName: item.name,
                  artistName: item.artist,
                });
              }}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.albumImage} />
              ) : (
                <View style={[styles.albumImage, styles.albumImageFallback]}>
                  <Text style={styles.albumInitials}>
                    {item.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text numberOfLines={1} style={styles.albumName}>
                {item.name}
              </Text>
              <Text numberOfLines={1} style={styles.albumArtist}>
                {item.artist}
              </Text>
            </Pressable>
          )}
        />
      ) : null}

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
          }
        }}
        onDetails={() => {
          if (selectedSong) {
            Alert.alert('Song Details', `Title: ${selectedSong.title}\nArtist: ${selectedSong.artist}\nAlbum: ${selectedSong.album || 'Unknown'}\nDuration: ${selectedSong.durationSec ? formatTime(selectedSong.durationSec) : 'Unknown'}`);
          }
        }}
        onSetAsRingtone={() => {
          Alert.alert('Set as Ringtone', 'This feature is not available in this app.');
        }}
        onAddToBlacklist={() => {
          Alert.alert('Add to Blacklist', 'This feature is not available in this app.');
        }}
        onShare={() => {
          Alert.alert('Share', `Share "${selectedSong?.title}" by ${selectedSong?.artist}`);
        }}
        onDeleteFromDevice={() => {
          Alert.alert('Delete from Device', 'This feature is not available in this app.');
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text,
    fontSize: 24,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearIcon: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.text,
  },
  listContent: {
    paddingBottom: 160,
    paddingHorizontal: 16,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  notFoundEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  notFoundTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  notFoundText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
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
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  artistImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
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
  artistInfo: {
    flex: 1,
  },
  artistName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistFollowers: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  albumRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  albumItem: {
    width: '48%',
    marginBottom: 16,
  },
  albumImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  albumImageFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumInitials: {
    color: '#000',
    fontSize: 32,
    fontWeight: '700',
  },
  albumName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  albumArtist: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
