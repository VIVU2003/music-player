import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { searchAlbums, searchArtists, searchSongs, type SaavnAlbum, type SaavnArtist } from '../api/saavn';
import { SongOptionsModal } from '../components/SongOptionsModal';
import { usePlayerStore } from '../state/playerStore';
import { colors } from '../theme/colors';
import type { Song } from '../types/music';
import { formatTime } from '../utils/time';

type Category = 'Songs' | 'Artists' | 'Albums' | 'Folders';

const RECENT_SEARCHES_KEY = '@soundwave:recent_searches';

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

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const setQueueAndPlay = usePlayerStore((s) => s.setQueueAndPlay);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const [songOptionsVisible, setSongOptionsVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Songs');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [artistResults, setArtistResults] = useState<SaavnArtist[]>([]);
  const [albumResults, setAlbumResults] = useState<SaavnAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categories: Category[] = ['Songs', 'Artists', 'Albums', 'Folders'];

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {

    }
  };

  const saveRecentSearches = async (searches: string[]) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {

    }
  };

  useEffect(() => {

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setNotFound(false);
      return;
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      setNotFound(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    debounceTimerRef.current = setTimeout(async () => {
      try {
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
          setSearchResults(songs);
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

          setSearchResults([]);
          setArtistResults([]);
          setAlbumResults([]);
          setNotFound(true);
        }
      } catch (error) {
        setSearchResults([]);
        setArtistResults([]);
        setAlbumResults([]);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, activeCategory]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const trimmedQuery = searchQuery.trim();
    const updatedSearches = [trimmedQuery, ...recentSearches.filter((s) => s !== trimmedQuery)].slice(0, 10);
    setRecentSearches(updatedSearches);
    await saveRecentSearches(updatedSearches);

    setHasSearched(true);

    setLoading(true);
    setNotFound(false);

    try {
      if (activeCategory === 'Songs') {
        const res = await searchSongs({ query: trimmedQuery, page: 1, limit: 50 });
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
          .filter((s) => isValidSearchResult(trimmedQuery, s.title, s.artist));
        setSearchResults(songs);
        setNotFound(songs.length === 0);
      } else if (activeCategory === 'Artists') {
        const res = await searchArtists({ query: trimmedQuery, page: 1, limit: 50 });
        const validArtists = res.results.filter((a) =>
          isValidSearchResult(trimmedQuery, a.name, '')
        );
        setArtistResults(validArtists);
        setNotFound(validArtists.length === 0);
      } else if (activeCategory === 'Albums') {
        const res = await searchAlbums({ query: trimmedQuery, page: 1, limit: 50 });
        const validAlbums = res.results.filter((a) =>
          isValidSearchResult(trimmedQuery, a.name, a.artist)
        );
        setAlbumResults(validAlbums);
        setNotFound(validAlbums.length === 0);
      }
    } catch (error) {
      setSearchResults([]);
      setArtistResults([]);
      setAlbumResults([]);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    await saveRecentSearches([]);
  };

  const removeRecentSearch = async (item: string) => {
    const updated = recentSearches.filter((s) => s !== item);
    setRecentSearches(updated);
    await saveRecentSearches(updated);
  };

  return (
    <View style={styles.container}>
      {}
      <View style={[styles.searchBarContainer, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
            value={query}
            onChangeText={(text) => {
              setQuery(text);

              if (text.trim().length === 0) {
                setHasSearched(false);
              }
            }}
            onSubmitEditing={() => {
              if (query.trim().length >= 2) {
                handleSearch(query);
              }
            }}
            placeholder="Search..."
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => {
                setQuery('');
                setHasSearched(false);
                setSearchResults([]);
                setArtistResults([]);
                setAlbumResults([]);
                setNotFound(false);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {}
      {query.length === 0 && !hasSearched ? (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            {recentSearches.length > 0 && (
              <Pressable onPress={clearRecentSearches}>
                <Text style={styles.clearAll}>Clear All</Text>
              </Pressable>
            )}
          </View>
          {recentSearches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent searches</Text>
            </View>
          ) : (
            <FlatList
              data={recentSearches}
              keyExtractor={(item, index) => `${item}-${index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.recentItem}
                  onPress={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                >
                  <Text style={styles.recentItemText}>{item}</Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(item);
                    }}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeIcon}>✕</Text>
                  </Pressable>
                </Pressable>
              )}
            />
          )}
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          <View style={styles.categoryTabs}>
            {categories.map((category) => (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                style={[styles.categoryTab, activeCategory === category && styles.categoryTabActive]}
              >
                <Text style={[styles.categoryText, activeCategory === category && styles.categoryTextActive]}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>

          {query.trim().length < 2 && !hasSearched ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Type at least 2 characters to search</Text>
            </View>
          ) : loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : notFound ? (
            <View style={styles.notFoundContainer}>
              <Text style={styles.notFoundEmoji}>😢</Text>
              <Text style={styles.notFoundTitle}>Not Found</Text>
              <Text style={styles.notFoundText}>
                Sorry, the keyword you entered cannot be found, please check again or search with another keyword.
              </Text>
            </View>
          ) : activeCategory === 'Songs' && searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <Pressable
                  style={styles.resultItem}
                  onPress={() => {
                    void setQueueAndPlay(searchResults, index);
                  }}
                >
                  {item.artworkUrl ? (
                    <Image source={{ uri: item.artworkUrl }} style={styles.resultArt} />
                  ) : (
                    <View style={[styles.resultArt, styles.resultArtFallback]}>
                      <Text style={styles.resultArtFallbackText}>♪</Text>
                    </View>
                  )}
                  <View style={styles.resultInfo}>
                    <Text numberOfLines={1} style={styles.resultTitle}>
                      {item.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.resultArtist}>
                      {item.artist}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.resultPlayButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      void setQueueAndPlay(searchResults, index);
                    }}
                  >
                    <Text style={styles.resultPlayIcon}>▶</Text>
                  </Pressable>
                  <Pressable
                    style={styles.resultMoreButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedSong(item);
                      setSongOptionsVisible(true);
                    }}
                  >
                    <Text style={styles.resultMoreIcon}>⋮</Text>
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
                  style={styles.resultItem}
                  onPress={() => {
                    navigation.navigate('Artist', { artistName: item.name });
                  }}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.resultArtistImage} />
                  ) : (
                    <View style={[styles.resultArtistImage, styles.resultArtistImageFallback]}>
                      <Text style={styles.resultArtistInitials}>
                        {item.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.resultInfo}>
                    <Text numberOfLines={1} style={styles.resultTitle}>
                      {item.name}
                    </Text>
                    {item.followers && (
                      <Text style={styles.resultArtistFollowers}>
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
        </View>
      )}

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
    paddingBottom: 12,
    gap: 12,
    backgroundColor: colors.background,
    zIndex: 10,
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
  searchInput: {
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
  recentSearchesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  clearAll: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  recentItemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  notFoundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
    minHeight: 300,
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
  listContent: {
    paddingTop: 8,
    paddingBottom: 160,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  resultArt: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginRight: 12,
  },
  resultArtFallback: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultArtFallbackText: {
    color: colors.textSecondary,
    fontSize: 24,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultArtist: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  searchButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  resultPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  resultPlayIcon: {
    color: colors.text,
    fontSize: 12,
    marginLeft: 2,
  },
  resultMoreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultMoreIcon: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  resultArtistImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    marginRight: 12,
  },
  resultArtistImageFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultArtistInitials: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
  },
  resultArtistFollowers: {
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
