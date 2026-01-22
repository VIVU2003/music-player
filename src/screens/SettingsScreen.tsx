import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { usePlayerStore } from '../state/playerStore';
import { colors } from '../theme/colors';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const library = usePlayerStore((s) => s.library);
  const favorites = usePlayerStore((s) => s.favorites);
  const playCounts = usePlayerStore((s) => s.playCounts);
  const mostPlayed = usePlayerStore((s) => s.mostPlayed);
  const songAddedAt = usePlayerStore((s) => s.songAddedAt);

  const stats = useMemo(() => {
    const totalSongs = library.length;
    const totalFavorites = favorites.length;
    const totalPlayCount = Object.values(playCounts).reduce((sum, count) => sum + count, 0);
    const uniqueArtists = new Set(library.map((s) => s.artist).filter(Boolean)).size;
    const uniqueAlbums = new Set(
      library
        .map((s) => (s.album ? `${s.album}|${s.artist}` : null))
        .filter(Boolean)
    ).size;
    const firstSongAdded = totalSongs > 0
      ? new Date(Math.min(...Object.values(songAddedAt).filter(Boolean) as number[]))
      : null;
    const memberSince = firstSongAdded
      ? firstSongAdded.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'N/A';

    return {
      totalSongs,
      totalFavorites,
      totalPlayCount,
      uniqueArtists,
      uniqueAlbums,
      memberSince,
    };
  }, [library, favorites, playCounts, songAddedAt]);

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const userName = 'Music Lover';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(userName)}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.memberSince}>Member since {stats.memberSince}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="musical-notes" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.totalSongs}</Text>
            <Text style={styles.statLabel}>Songs</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="heart" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.totalFavorites}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="play-circle" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.totalPlayCount}</Text>
            <Text style={styles.statLabel}>Plays</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="person" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.uniqueArtists}</Text>
            <Text style={styles.statLabel}>Artists</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="disc" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats.uniqueAlbums}</Text>
            <Text style={styles.statLabel}>Albums</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{mostPlayed.length}</Text>
            <Text style={styles.statLabel}>Top Songs</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContent}>
          <View style={styles.settingItem}>
            <Ionicons name="person-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Profile Name</Text>
            <Text style={styles.settingValue}>{userName}</Text>
          </View>
          <View style={styles.settingItem}>
            <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Member Since</Text>
            <Text style={styles.settingValue}>{stats.memberSince}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Library</Text>
        <View style={styles.sectionContent}>
          <View style={styles.settingItem}>
            <Ionicons name="musical-notes-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Total Songs</Text>
            <Text style={styles.settingValue}>{stats.totalSongs}</Text>
          </View>
          <View style={styles.settingItem}>
            <Ionicons name="heart-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Favorite Songs</Text>
            <Text style={styles.settingValue}>{stats.totalFavorites}</Text>
          </View>
          <View style={styles.settingItem}>
            <Ionicons name="person-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Artists</Text>
            <Text style={styles.settingValue}>{stats.uniqueArtists}</Text>
          </View>
          <View style={styles.settingItem}>
            <Ionicons name="disc-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Albums</Text>
            <Text style={styles.settingValue}>{stats.uniqueAlbums}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <View style={styles.sectionContent}>
          <View style={styles.settingItem}>
            <Ionicons name="play-circle-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Total Plays</Text>
            <Text style={styles.settingValue}>{stats.totalPlayCount.toLocaleString()}</Text>
          </View>
          <View style={styles.settingItem}>
            <Ionicons name="trending-up-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Top Songs</Text>
            <Text style={styles.settingValue}>{mostPlayed.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>SoundWave Music Player</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 160,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surfaceElevated,
  },
  avatarText: {
    color: '#000',
    fontSize: 32,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  memberSince: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  settingLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  settingValue: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerVersion: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },
});
