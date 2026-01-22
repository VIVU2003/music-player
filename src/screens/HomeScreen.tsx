import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { searchSongs } from '../api/saavn';
import { AlbumOptionsModal } from '../components/AlbumOptionsModal';
import { ArtistOptionsModal } from '../components/ArtistOptionsModal';
import { SongOptionsModal } from '../components/SongOptionsModal';
import { SortModal } from '../components/SortModal';
import { SongRow } from '../components/SongRow';
import { TopTabs } from '../components/TopTabs';
import { usePlayerStore } from '../state/playerStore';
import { colors } from '../theme/colors';
import type { Song } from '../types/music';
import { formatTime } from '../utils/time';

type Tab = 'Suggested' | 'Songs' | 'Artists' | 'Albums' | 'Folders';
type SortOrder = 'Ascending' | 'Descending';
type SortBy = 'Artist' | 'Album' | 'Year' | 'Date Added' | 'Date Modified' | 'Composer';

type ArtistData = {
  artistName: string;
  artistImage?: string;
  songCount: number;
  albumCount: number;
  firstAddedAt: number;
  lastPlayedAt: number;
  totalPlayCount: number;
};

type AlbumData = {
  albumId: string;
  albumName: string;
  albumArtist: string;
  albumArt?: string;
  year?: number;
  songCount: number;
  totalDuration: number;
  firstAddedAt: number;
  lastModifiedAt: number;
  lastPlayedAt: number;
};

function toSong(s: any): Song {
  return {
    id: s.id,
    title: s.title,
    artist: s.artist,
    album: s.album,
    durationSec: s.durationSec,
    artworkUrl: s.artworkUrl,
    streamUrl: s.streamUrl,
  };
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const setQueueAndPlay = usePlayerStore((s) => s.setQueueAndPlay);
  const queue = usePlayerStore((s) => s.queue);
  const library = usePlayerStore((s) => s.library);
  const mostPlayed = usePlayerStore((s) => s.mostPlayed);
  const lastError = usePlayerStore((s) => s.lastError);
  const playCounts = usePlayerStore((s) => s.playCounts);
  const songAddedAt = usePlayerStore((s) => s.songAddedAt);
  const songPlayedAt = usePlayerStore((s) => s.songPlayedAt);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const [activeTab, setActiveTab] = useState<Tab>('Suggested');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState<Song[]>([]);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [songsSearchQuery, setSongsSearchQuery] = useState('');
  const [debouncedSongsSearchQuery, setDebouncedSongsSearchQuery] = useState('');
  const songsSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('Ascending');
  const [sortBy, setSortBy] = useState<SortBy>('Artist');
  const [artistSortBy, setArtistSortBy] = useState<'Date Added' | 'Name' | 'Most Played' | 'Recently Played'>('Date Added');
  const [artistSortOrder, setArtistSortOrder] = useState<'Ascending' | 'Descending'>('Descending');
  const [albumSortBy, setAlbumSortBy] = useState<'Date Modified' | 'Date Added' | 'Album Name' | 'Artist Name' | 'Year' | 'Recently Played'>('Date Modified');
  const [albumSortOrder, setAlbumSortOrder] = useState<'Ascending' | 'Descending'>('Descending');
  const [songOptionsVisible, setSongOptionsVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [artistOptionsVisible, setArtistOptionsVisible] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistData | null>(null);
  const [albumOptionsVisible, setAlbumOptionsVisible] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumData | null>(null);

  useEffect(() => {
    const params = route.params as { resetToSuggested?: boolean } | undefined;
    if (params?.resetToSuggested) {
      setActiveTab('Suggested');
      navigation.setParams({ resetToSuggested: undefined });
    }
  }, [route.params, navigation]);

  useFocusEffect(
    useCallback(() => {
      const parentNavigator = navigation.getParent();
      if (parentNavigator) {
        const parentState = parentNavigator.getState();
        const homeTabRoute = parentState?.routes?.find((r: any) => r.name === 'HomeStack');
        const homeStackState = homeTabRoute?.state;
        const isAtRoot = !homeStackState || (typeof homeStackState.index === 'number' && homeStackState.index === 0);
        
        if (isAtRoot) {
          setActiveTab('Suggested');
        }
      } else {
        setActiveTab('Suggested');
      }
    }, [navigation])
  );

  const canLoadMore = useMemo(() => {
    if (!total) return true;
    return results.length < total;
  }, [results.length, total]);

  const recentlyPlayed = useMemo(() => {
    return library
      .filter((song) => songPlayedAt[song.id])
      .sort((a, b) => (songPlayedAt[b.id] || 0) - (songPlayedAt[a.id] || 0))
      .slice(0, 10);
  }, [library, songPlayedAt]);

  const uniqueArtists = useMemo(() => {
    const artistMap = new Map<string, { name: string; artworkUrl?: string }>();

    recentlyPlayed.forEach((song) => {
      if (song.artist && !artistMap.has(song.artist)) {
        artistMap.set(song.artist, {
          name: song.artist,
          artworkUrl: song.artworkUrl,
        });
      }
    });

    results.forEach((song) => {
      if (song.artist && !artistMap.has(song.artist)) {
        artistMap.set(song.artist, {
          name: song.artist,
          artworkUrl: song.artworkUrl,
        });
      }
    });

    return Array.from(artistMap.values()).slice(0, 10);
  }, [recentlyPlayed, results]);

  const normalizeArtistName = (name: string): string => {
    return name.trim().toLowerCase();
  };

  const normalizeAlbumKey = (albumName: string, artistName: string): string => {
    return `${albumName.trim().toLowerCase()}|${artistName.trim().toLowerCase()}`;
  };

  const allArtists = useMemo(() => {
    const artistMap = new Map<string, ArtistData & { albums: Set<string>; songs: Song[]; nameVariants: Set<string> }>();

    library.forEach((song) => {
      if (!song.artist) return;

      const artistName = song.artist.trim();
      const normalizedName = normalizeArtistName(artistName);
      const addedAt = songAddedAt[song.id] || Date.now();
      const playedAt = songPlayedAt[song.id] || 0;
      const playCount = playCounts[song.id] || 0;

      if (artistMap.has(normalizedName)) {
        const artist = artistMap.get(normalizedName)!;
        artist.songs.push(song);
        artist.songCount++;
        artist.nameVariants.add(artistName);
        if (song.album) {
          artist.albums.add(song.album);
          artist.albumCount = artist.albums.size;
        }

        if (addedAt < artist.firstAddedAt) {
          artist.firstAddedAt = addedAt;
        }
        if (playedAt > artist.lastPlayedAt) {
          artist.lastPlayedAt = playedAt;
        }
        artist.totalPlayCount += playCount;

        if (artistName.length > artist.artistName.length ||
            (artistName.length === artist.artistName.length && artistName < artist.artistName)) {
          artist.artistName = artistName;
        }
      } else {
        const albums = new Set<string>();
        const nameVariants = new Set<string>();
        nameVariants.add(artistName);
        if (song.album) albums.add(song.album);
        artistMap.set(normalizedName, {
          artistName,
          artistImage: song.artworkUrl,
          songCount: 1,
          albumCount: albums.size,
          firstAddedAt: addedAt,
          lastPlayedAt: playedAt,
          totalPlayCount: playCount,
          albums,
          songs: [song],
          nameVariants,
        });
      }
    });

    let artistsArray: ArtistData[] = Array.from(artistMap.values()).map(({ albums, songs, nameVariants, ...rest }) => {

      const songsWithArtwork = songs.filter(s => s.artworkUrl);
      if (songsWithArtwork.length > 0) {

        songsWithArtwork.sort((a, b) => a.title.localeCompare(b.title));
        rest.artistImage = songsWithArtwork[0].artworkUrl;
      } else {
        rest.artistImage = undefined;
      }
      return rest;
    });

    artistsArray = artistsArray.filter(artist => artist.songCount > 0);

    const multiplier = artistSortOrder === 'Ascending' ? 1 : -1;

    switch (artistSortBy) {
      case 'Date Added':
        artistsArray.sort((a, b) => (b.firstAddedAt - a.firstAddedAt) * multiplier);
        break;
      case 'Name':
        artistsArray.sort((a, b) => a.artistName.localeCompare(b.artistName) * multiplier);
        break;
      case 'Most Played':
        artistsArray.sort((a, b) => (b.totalPlayCount - a.totalPlayCount) * multiplier);
        break;
      case 'Recently Played':
        artistsArray.sort((a, b) => (b.lastPlayedAt - a.lastPlayedAt) * multiplier);
        break;
    }

    return artistsArray;
  }, [library, playCounts, songAddedAt, songPlayedAt, artistSortBy, artistSortOrder]);

  const allAlbums = useMemo(() => {
    const albumMap = new Map<string, AlbumData & { songs: Song[]; years: Map<number, number>; nameVariants: Set<string>; artistVariants: Set<string> }>();

    library.forEach((song) => {

      if (!song.album || song.album.trim() === '') {
        return;
      }

      const albumName = song.album.trim();

      const albumArtist = song.artist?.trim() || 'Unknown Artist';

      const normalizedKey = normalizeAlbumKey(albumName, albumArtist);
      const addedAt = songAddedAt[song.id] || Date.now();
      const playedAt = songPlayedAt[song.id] || 0;
      const durationSec = song.durationSec || 0;

      if (albumMap.has(normalizedKey)) {
        const album = albumMap.get(normalizedKey)!;
        album.songs.push(song);
        album.songCount++;
        album.totalDuration += durationSec;

        album.nameVariants.add(albumName);
        album.artistVariants.add(albumArtist);

        if (addedAt < album.firstAddedAt) {
          album.firstAddedAt = addedAt;
        }
        if (addedAt > album.lastModifiedAt) {
          album.lastModifiedAt = addedAt;
        }
        if (playedAt > album.lastPlayedAt) {
          album.lastPlayedAt = playedAt;
        }
      } else {

        const stableAlbumId = `${albumName}__${albumArtist}`;

        albumMap.set(normalizedKey, {
          albumId: stableAlbumId,
          albumName,
          albumArtist,
          albumArt: song.artworkUrl,
          year: undefined,
          songCount: 1,
          totalDuration: durationSec,
          firstAddedAt: addedAt,
          lastModifiedAt: addedAt,
          lastPlayedAt: playedAt,
          songs: [song],
          years: new Map(),
          nameVariants: new Set([albumName]),
          artistVariants: new Set([albumArtist]),
        });
      }
    });

    let albumsArray: AlbumData[] = Array.from(albumMap.values()).map(({ songs, years, nameVariants, artistVariants, ...rest }) => {

      const albumNameVariants = Array.from(nameVariants);
      const artistNameVariants = Array.from(artistVariants);
      const displayAlbumName = albumNameVariants.reduce((a, b) => a.length > b.length ? a : b, albumNameVariants[0]);
      const displayAlbumArtist = artistNameVariants.reduce((a, b) => a.length > b.length ? a : b, artistNameVariants[0]);

      rest.albumId = `${displayAlbumName}__${displayAlbumArtist}`;
      rest.albumName = displayAlbumName;
      rest.albumArtist = displayAlbumArtist;

      if (songs.length > 0) {
        const firstSongWithArtwork = songs.find(s => s.artworkUrl);
        rest.albumArt = firstSongWithArtwork?.artworkUrl || songs[0]?.artworkUrl;
      } else {
        rest.albumArt = undefined;
      }

      return rest;
    });

    albumsArray = albumsArray.filter(album => album.songCount > 0);

    const multiplier = albumSortOrder === 'Ascending' ? 1 : -1;

    switch (albumSortBy) {
      case 'Date Modified':
        albumsArray.sort((a, b) => (b.lastModifiedAt - a.lastModifiedAt) * multiplier);
        break;
      case 'Date Added':
        albumsArray.sort((a, b) => (b.firstAddedAt - a.firstAddedAt) * multiplier);
        break;
      case 'Album Name':
        albumsArray.sort((a, b) => a.albumName.localeCompare(b.albumName) * multiplier);
        break;
      case 'Artist Name':
        albumsArray.sort((a, b) => a.albumArtist.localeCompare(b.albumArtist) * multiplier);
        break;
      case 'Year':
        albumsArray.sort((a, b) => {
          const yearA = a.year || 0;
          const yearB = b.year || 0;
          return (yearB - yearA) * multiplier;
        });
        break;
      case 'Recently Played':
        albumsArray.sort((a, b) => (b.lastPlayedAt - a.lastPlayedAt) * multiplier);
        break;
    }

    return albumsArray;
  }, [library, songAddedAt, songPlayedAt, albumSortBy, albumSortOrder]);

  useEffect(() => {
    if (songsSearchDebounceRef.current) {
      clearTimeout(songsSearchDebounceRef.current);
    }
    songsSearchDebounceRef.current = setTimeout(() => {
      setDebouncedSongsSearchQuery(songsSearchQuery);
    }, 300);
    return () => {
      if (songsSearchDebounceRef.current) {
        clearTimeout(songsSearchDebounceRef.current);
      }
    };
  }, [songsSearchQuery]);

  const allSongs = useMemo(() => {
    return [...library];
  }, [library]);

  const filteredSongs = useMemo(() => {
    if (!debouncedSongsSearchQuery.trim()) {
      return allSongs;
    }
    const searchTerm = debouncedSongsSearchQuery.trim().toLowerCase();
    return allSongs.filter((song) => {
      const titleMatch = song.title?.toLowerCase().includes(searchTerm) || false;
      const artistMatch = song.artist?.toLowerCase().includes(searchTerm) || false;
      return titleMatch || artistMatch;
    });
  }, [allSongs, debouncedSongsSearchQuery]);

  const sortedFilteredSongs = useMemo(() => {
    const sorted = [...filteredSongs];
    const multiplier = sortOrder === 'Ascending' ? 1 : -1;

    switch (sortBy) {
      case 'Artist':
        sorted.sort((a, b) => (a.artist || '').localeCompare(b.artist || '') * multiplier);
        break;
      case 'Album':
        sorted.sort((a, b) => (a.album || '').localeCompare(b.album || '') * multiplier);
        break;
      case 'Year':
        sorted.sort((a, b) => ((a.durationSec || 0) - (b.durationSec || 0)) * multiplier);
        break;
      case 'Date Added':
      case 'Date Modified':
        sorted.sort((a, b) => a.title.localeCompare(b.title) * multiplier);
        break;
      case 'Composer':
        sorted.sort((a, b) => (a.artist || '').localeCompare(b.artist || '') * multiplier);
        break;
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title) * multiplier);
    }

    return sorted;
  }, [filteredSongs, sortOrder, sortBy]);

  const sortedResults = useMemo(() => {
    const sorted = [...results];
    const multiplier = sortOrder === 'Ascending' ? 1 : -1;

    switch (sortBy) {
      case 'Artist':
        sorted.sort((a, b) => a.artist.localeCompare(b.artist) * multiplier);
        break;
      case 'Album':
        sorted.sort((a, b) => (a.album || '').localeCompare(b.album || '') * multiplier);
        break;
      case 'Year':

        sorted.sort((a, b) => ((a.durationSec || 0) - (b.durationSec || 0)) * multiplier);
        break;
      case 'Date Added':
      case 'Date Modified':

        sorted.sort((a, b) => a.title.localeCompare(b.title) * multiplier);
        break;
      case 'Composer':

        sorted.sort((a, b) => a.artist.localeCompare(b.artist) * multiplier);
        break;
      default:

        sorted.sort((a, b) => a.title.localeCompare(b.title) * multiplier);
    }

    return sorted;
  }, [results, sortOrder, sortBy]);

  async function runSearch(nextPage: number, mode: 'replace' | 'append') {
    if (!query.trim()) return;
    try {
      mode === 'replace' ? setLoading(true) : setLoadingMore(true);
      const searchQuery = query.trim();
      const res = await searchSongs({ query: searchQuery, page: nextPage, limit: 20 });
      const songs = res.results.map(toSong);
      setTotal(res.total);
      setPage(nextPage);
      setResults((prev) => (mode === 'replace' ? songs : [...prev, ...songs]));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  const renderSuggested = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {recentlyPlayed.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Played</Text>
            <Pressable
              onPress={() => {

                setActiveTab('Songs');
              }}
            >
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {recentlyPlayed.slice(0, 5).map((song, idx) => (
              <Pressable
                key={`recently-${song.id}-${idx}`}
                style={styles.card}
                onPress={() => {

                  const libraryIndex = library.findIndex((s) => s.id === song.id);
                  if (libraryIndex >= 0) {

                    void setQueueAndPlay(library, libraryIndex);
                  } else {

                    void setQueueAndPlay([song], 0);
                  }
                  navigation.navigate('Player');
                }}
              >
                <Image source={{ uri: song.artworkUrl }} style={styles.cardImage} />
                <Text numberOfLines={2} style={styles.cardTitle}>
                  {song.title}
                </Text>
                <Text numberOfLines={1} style={styles.cardSubtitle}>
                  {song.artist}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {uniqueArtists.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artists</Text>
            <Pressable
              onPress={() => {

                setActiveTab('Artists');
              }}
            >
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {uniqueArtists.slice(0, 10).map((artist, idx) => (
              <Pressable
                key={`${artist.name}-${idx}`}
                style={styles.artistCard}
                onPress={() => {
                  navigation.navigate('Artist', { artistName: artist.name });
                }}
              >
                <Image source={{ uri: artist.artworkUrl }} style={styles.artistImage} />
                <Text numberOfLines={1} style={styles.artistName}>
                  {artist.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {mostPlayed.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Most Played</Text>
            <Pressable
              onPress={() => {

                setActiveTab('Songs');
              }}
            >
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {mostPlayed.slice(0, 10).map((song, idx) => (
              <Pressable
                key={`mostplayed-${song.id}-${idx}`}
                style={styles.card}
                onPress={() => {
                  const index = queue.findIndex((s) => s.id === song.id);
                  if (index >= 0) {
                    void setQueueAndPlay(queue, index);
                  } else {

                    void setQueueAndPlay([song], 0);
                  }
                  navigation.navigate('Player');
                }}
              >
                <Image source={{ uri: song.artworkUrl }} style={styles.cardImage} />
                <Text numberOfLines={2} style={styles.cardTitle}>
                  {song.title}
                </Text>
                <Text numberOfLines={1} style={styles.cardSubtitle}>
                  {song.artist}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {results.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyTitle}>Start Exploring</Text>
          <Text style={styles.emptySubtitle}>Search for your favorite songs</Text>
        </View>
      )}
    </ScrollView>
  );

  const getArtistInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderArtists = () => (
    <View style={styles.artistsContainer}>
      <View style={styles.artistsHeader}>
        <Text style={styles.artistsCount}>
          {allArtists.length > 0 ? `${allArtists.length} ${allArtists.length === 1 ? 'artist' : 'artists'}` : '0 artists'}
        </Text>
        {allArtists.length > 0 && (
          <Pressable
            style={styles.sortButton}
            onPress={() => {

              const sortOptions: Array<'Date Added' | 'Name' | 'Most Played' | 'Recently Played'> =
                ['Date Added', 'Name', 'Most Played', 'Recently Played'];
              const currentIndex = sortOptions.indexOf(artistSortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              setArtistSortBy(sortOptions[nextIndex]);

              if (nextIndex === currentIndex) {
                setArtistSortOrder(artistSortOrder === 'Ascending' ? 'Descending' : 'Ascending');
              } else {
                setArtistSortOrder('Descending');
              }
            }}
          >
            <Text style={styles.sortText}>{artistSortBy}</Text>
            <Text style={styles.sortIcon}>⇅</Text>
          </Pressable>
        )}
      </View>
      {allArtists.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎤</Text>
          <Text style={styles.emptyTitle}>No Artists</Text>
          <Text style={styles.emptySubtitle}>Artists will appear here once you play or add songs.</Text>
        </View>
      ) : (
        <FlatList
          data={allArtists}
          keyExtractor={(item) => item.artistName}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.artistItem}
              onPress={() => {
                setSelectedArtist(item);
                setArtistOptionsVisible(true);
              }}
            >
              {item.artistImage ? (
                <Image
                  source={{ uri: item.artistImage }}
                  style={styles.artistItemImage}
                />
              ) : (
                <View style={[styles.artistItemImage, styles.artistItemImageFallback]}>
                  <Text style={styles.artistInitials}>{getArtistInitials(item.artistName)}</Text>
                </View>
              )}
              <View style={styles.artistItemInfo}>
                <Text numberOfLines={1} style={styles.artistItemName}>
                  {item.artistName}
                </Text>
                <Text numberOfLines={1} style={styles.artistItemDetails}>
                  {item.albumCount} {item.albumCount === 1 ? 'Album' : 'Albums'} | {item.songCount} {item.songCount === 1 ? 'Song' : 'Songs'}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );

  const getAlbumInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderAlbums = () => (
    <View style={styles.albumsContainer}>
      <View style={styles.albumsHeader}>
        <Text style={styles.albumsCount}>
          {allAlbums.length > 0 ? `${allAlbums.length} ${allAlbums.length === 1 ? 'album' : 'albums'}` : '0 albums'}
        </Text>
        {allAlbums.length > 0 && (
          <Pressable
            style={styles.sortButton}
            onPress={() => {

              const sortOptions: Array<'Date Modified' | 'Date Added' | 'Album Name' | 'Artist Name' | 'Year' | 'Recently Played'> =
                ['Date Modified', 'Date Added', 'Album Name', 'Artist Name', 'Year', 'Recently Played'];
              const currentIndex = sortOptions.indexOf(albumSortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              setAlbumSortBy(sortOptions[nextIndex]);

              if (nextIndex === currentIndex) {
                setAlbumSortOrder(albumSortOrder === 'Ascending' ? 'Descending' : 'Ascending');
              } else {
                setAlbumSortOrder('Descending');
              }
            }}
          >
            <Text style={styles.sortText}>{albumSortBy}</Text>
            <Text style={styles.sortIcon}>⇅</Text>
          </Pressable>
        )}
      </View>
      {allAlbums.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💿</Text>
          <Text style={styles.emptyTitle}>No Albums</Text>
          <Text style={styles.emptySubtitle}>Albums appear here once you add or play music.</Text>
        </View>
      ) : (
        <FlatList
          data={allAlbums}
          keyExtractor={(item) => item.albumId}
          numColumns={2}
          contentContainerStyle={styles.albumsGrid}
          columnWrapperStyle={styles.albumRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            return (
              <View style={styles.albumCard}>
                <Pressable
                  style={styles.albumCardContent}
                  onPress={() => {
                    navigation.navigate('Album', {
                      albumName: item.albumName,
                      artistName: item.albumArtist,
                    });
                  }}
                >
                  {item.albumArt ? (
                    <Image source={{ uri: item.albumArt }} style={styles.albumArt} />
                  ) : (
                    <View style={[styles.albumArt, styles.albumArtFallback]}>
                      <Text style={styles.albumInitials}>{getAlbumInitials(item.albumName)}</Text>
                    </View>
                  )}
                  <View style={styles.albumInfo}>
                    <View style={styles.albumTitleRow}>
                      <Text numberOfLines={1} style={styles.albumTitle}>
                        {item.albumName}
                      </Text>
                      <Pressable
                        style={styles.albumMoreButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedAlbum(item);
                          setAlbumOptionsVisible(true);
                        }}
                      >
                        <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                    <Text numberOfLines={1} style={styles.albumArtist}>
                      {item.albumArtist}{item.year ? ` | ${item.year}` : ''}
                    </Text>
                    <Text style={styles.albumSongCount}>
                      {item.songCount} {item.songCount === 1 ? 'song' : 'songs'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );

  const renderSongs = () => (
    <View style={styles.songsContainer}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchBarIcon} />
          <TextInput
            value={songsSearchQuery}
            onChangeText={setSongsSearchQuery}
            placeholder="Search within songs"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {songsSearchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                setSongsSearchQuery('');
              }}
              style={styles.clearSearchButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.songsHeader}>
        <Text style={styles.songsCount}>
          {songsSearchQuery.trim()
            ? `${filteredSongs.length} ${filteredSongs.length === 1 ? 'song' : 'songs'}`
            : `${allSongs.length} ${allSongs.length === 1 ? 'song' : 'songs'}`}
        </Text>
        {sortedFilteredSongs.length > 0 && (
          <Pressable style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
            <Text style={styles.sortText}>{sortOrder}</Text>
            <Text style={styles.sortIcon}>⇅</Text>
          </Pressable>
        )}
      </View>
      {sortedFilteredSongs.length === 0 && !songsSearchQuery.trim() ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No songs in library</Text>
          <Text style={styles.emptySubtitle}>Songs will appear here once you add them</Text>
        </View>
      ) : sortedFilteredSongs.length === 0 && songsSearchQuery.trim() ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No songs found</Text>
          <Text style={styles.emptySubtitle}>Try a different song name or artist</Text>
        </View>
      ) : (
        <FlatList
          data={sortedFilteredSongs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const originalIndex = filteredSongs.findIndex((s) => s.id === item.id);
            return (
              <Pressable
                style={styles.songItem}
                onPress={() => {
                  void setQueueAndPlay(filteredSongs, originalIndex >= 0 ? originalIndex : index);
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
                    void setQueueAndPlay(filteredSongs, originalIndex >= 0 ? originalIndex : index);
                    navigation.navigate('Player');
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
            );
          }}
        />
      )}
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>🎵</Text>
          <Text style={styles.appName}>Mume</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Search')}>
          <Text style={styles.searchIcon}>🔍</Text>
        </Pressable>
      </View>

      <TopTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'Suggested' && renderSuggested()}
      {activeTab === 'Songs' && renderSongs()}
      {activeTab === 'Artists' && renderArtists()}
      {activeTab === 'Albums' && renderAlbums()}
      {activeTab === 'Folders' && (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{activeTab} coming soon</Text>
        </View>
      )}

      <SortModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        sortOrder={sortOrder}
        sortBy={sortBy}
        onSortOrderChange={setSortOrder}
        onSortByChange={setSortBy}
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

      <ArtistOptionsModal
        visible={artistOptionsVisible}
        artist={selectedArtist}
        onClose={() => {
          setArtistOptionsVisible(false);
          setSelectedArtist(null);
        }}
        onPlay={() => {
          if (selectedArtist) {

            const normalizedName = normalizeArtistName(selectedArtist.artistName);
            const artistSongs = library.filter((s) =>
              s.artist && normalizeArtistName(s.artist) === normalizedName
            );
            if (artistSongs.length > 0) {
              void setQueueAndPlay(artistSongs, 0);
              navigation.navigate('Player');
            } else {
              Alert.alert('No Songs', `No songs by ${selectedArtist.artistName} found in your library.`);
            }
          }
        }}
        onPlayNext={() => {
          if (selectedArtist) {
            const normalizedName = normalizeArtistName(selectedArtist.artistName);
            const artistSongs = library.filter((s) =>
              s.artist && normalizeArtistName(s.artist) === normalizedName
            );
            if (artistSongs.length > 0) {
              const store = usePlayerStore.getState();
              const currentIndex = store.currentIndex;
              const queue = store.queue;
              const newQueue = [...queue];
              const insertIndex = currentIndex >= 0 ? currentIndex + 1 : queue.length;

              newQueue.splice(insertIndex, 0, ...artistSongs);
              void store.setQueueAndPlay(newQueue, insertIndex);
              navigation.navigate('Player');
            } else {
              Alert.alert('No Songs', `No songs by ${selectedArtist.artistName} found in your library.`);
            }
          }
        }}
        onAddToQueue={() => {
          if (selectedArtist) {
            const normalizedName = normalizeArtistName(selectedArtist.artistName);
            const artistSongs = library.filter((s) =>
              s.artist && normalizeArtistName(s.artist) === normalizedName
            );
            if (artistSongs.length > 0) {
              artistSongs.forEach((song) => addToQueue(song));
              Alert.alert('Added to Queue', `Added ${artistSongs.length} song${artistSongs.length === 1 ? '' : 's'} by ${selectedArtist.artistName} to queue.`);
            } else {
              Alert.alert('No Songs', `No songs by ${selectedArtist.artistName} found in your library.`);
            }
          }
        }}
        onAddToPlaylist={() => {
          Alert.alert('Add to Playlist', 'This feature is not available in this app.');
        }}
        onGoToArtist={() => {
          if (selectedArtist) {
            navigation.navigate('Artist', { artistName: selectedArtist.artistName });
          }
        }}
        onShare={() => {
          if (selectedArtist) {
            Alert.alert('Share', `Share "${selectedArtist.artistName}"`);
          }
        }}
      />

      <AlbumOptionsModal
        visible={albumOptionsVisible}
        album={selectedAlbum}
        onClose={() => {
          setAlbumOptionsVisible(false);
          setSelectedAlbum(null);
        }}
        onPlay={() => {
          if (selectedAlbum) {

            const normalizedKey = normalizeAlbumKey(selectedAlbum.albumName, selectedAlbum.albumArtist);
            const albumSongs = library.filter((s) =>
              s.album && s.artist &&
              s.album.trim() !== '' &&
              normalizeAlbumKey(s.album, s.artist) === normalizedKey
            );
            if (albumSongs.length > 0) {
              void setQueueAndPlay(albumSongs, 0);
              navigation.navigate('Player');
            } else {
              Alert.alert('No Songs', `No songs from "${selectedAlbum.albumName}" found in your library.`);
            }
          }
        }}
        onShuffle={() => {
          if (selectedAlbum) {
            const normalizedKey = normalizeAlbumKey(selectedAlbum.albumName, selectedAlbum.albumArtist);
            const albumSongs = library.filter((s) =>
              s.album && s.artist &&
              s.album.trim() !== '' &&
              normalizeAlbumKey(s.album, s.artist) === normalizedKey
            );
            if (albumSongs.length > 0) {
              const shuffled = [...albumSongs].sort(() => Math.random() - 0.5);
              void setQueueAndPlay(shuffled, 0);
              navigation.navigate('Player');
            } else {
              Alert.alert('No Songs', `No songs from "${selectedAlbum.albumName}" found in your library.`);
            }
          }
        }}
        onAddToPlaylist={() => {
          Alert.alert('Add to Playlist', 'This feature is not available in this app.');
        }}
        onGoToArtist={() => {
          if (selectedAlbum) {
            navigation.navigate('Artist', { artistName: selectedAlbum.albumArtist });
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 24,
  },
  appName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  searchIcon: {
    fontSize: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  seeAll: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  card: {
    width: 140,
    marginRight: 16,
  },
  cardImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  artistCard: {
    width: 100,
    marginRight: 16,
    alignItems: 'center',
  },
  artistImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  artistName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  songsContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchBarIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  songsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  songsCount: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  sortIcon: {
    color: colors.primary,
    fontSize: 16,
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  artistsContainer: {
    flex: 1,
  },
  artistsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  artistsCount: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  artistItemImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    marginRight: 16,
  },
  artistItemImageFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInitials: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
  },
  artistItemInfo: {
    flex: 1,
  },
  artistItemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  artistItemDetails: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  albumsContainer: {
    flex: 1,
  },
  albumsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  albumsCount: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  albumsGrid: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  albumRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  albumCard: {
    width: '48%',
  },
  albumCardContent: {
    width: '100%',
  },
  albumArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  albumArtFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumInitials: {
    color: '#000',
    fontSize: 32,
    fontWeight: '700',
  },
  albumInfo: {
    width: '100%',
  },
  albumTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  albumTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  albumMoreButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  albumArtist: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  albumSongCount: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
