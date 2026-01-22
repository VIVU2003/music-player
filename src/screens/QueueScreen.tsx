import { useNavigation } from '@react-navigation/native';
import { useState, useMemo } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';

import { SongOptionsModal } from '../components/SongOptionsModal';
import { usePlayerStore } from '../state/playerStore';
import { colors } from '../theme/colors';
import type { Song } from '../types/music';
import { formatTime } from '../utils/time';

export function QueueScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const playIndex = usePlayerStore((s) => s.playIndex);
  const moveInQueue = usePlayerStore((s) => s.moveInQueue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const setShuffle = usePlayerStore((s) => s.setShuffle);
  const cycleRepeatMode = usePlayerStore((s) => s.cycleRepeatMode);

  const [songOptionsVisible, setSongOptionsVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const data = useMemo(() => queue, [queue]);

  const handleClearQueue = () => {
    Alert.alert(
      'Clear Queue',
      'Are you sure you want to clear the entire queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearQueue();
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!queue.length) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Queue</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Queue is Empty</Text>
          <Text style={styles.emptyText}>Add songs from the home screen to start your queue</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.cta}>
            <Text style={styles.ctaText}>Browse Music</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Song>) => {
    const index = data.findIndex((s) => s.id === item.id);
    const active = index === currentIndex;
    return (
      <Pressable
        onLongPress={drag}
        onPress={() => {
          void playIndex(index);
          navigation.navigate('Player');
        }}
        style={[styles.row, isActive && styles.rowActive, active && styles.rowPlaying]}
      >
        <Image source={{ uri: item.artworkUrl }} style={styles.artwork} />
        <View style={styles.rowNumber}>
          <Text style={[styles.rowNumberText, active && styles.rowNumberTextActive]}>
            {active ? '▶' : index + 1}
          </Text>
        </View>
        <View style={styles.rowMeta}>
          <Text numberOfLines={1} style={[styles.title, active && styles.titleActive]}>
            {item.title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {item.artist} {item.durationSec ? `• ${formatTime(item.durationSec)}` : ''}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            setSelectedSong(item);
            setSongOptionsVisible(true);
          }}
          style={styles.moreButton}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            removeFromQueue(item.id);
          }}
          style={styles.remove}
        >
          <Ionicons name="close" size={18} color="#EF4444" />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Queue</Text>
            <Text style={styles.headerSubtitle}>{queue.length} {queue.length === 1 ? 'song' : 'songs'}</Text>
          </View>
          {queue.length > 0 && (
            <Pressable onPress={handleClearQueue} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        {queue.length > 0 && (
          <>
            <View style={styles.shuffleRepeatRow}>
              <Pressable
                style={styles.shuffleRepeatButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShuffle(!shuffle);
                }}
              >
                <Ionicons
                  name="shuffle"
                  size={20}
                  color={shuffle ? colors.primary : colors.textSecondary}
                />
              </Pressable>

              <View style={styles.shuffleRepeatSpacer} />

              <Pressable
                style={styles.shuffleRepeatButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  cycleRepeatMode();
                }}
              >
                <Ionicons
                  name={repeatMode === 'one' ? 'repeat' : repeatMode === 'all' ? 'repeat' : 'repeat-outline'}
                  size={20}
                  color={repeatMode !== 'off' ? colors.primary : colors.textSecondary}
                />
                {repeatMode === 'one' && (
                  <View style={styles.repeatOneIndicator}>
                    <Text style={styles.repeatOneText}>1</Text>
                  </View>
                )}
              </Pressable>
            </View>
            <View style={styles.divider} />
          </>
        )}
      </View>
      {queue.length > 0 && <Text style={styles.hint}>Long-press and drag to reorder</Text>}
      <DraggableFlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ from, to }) => moveInQueue(from, to)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
            addToQueue(selectedSong);
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
            const minutes = Math.floor((selectedSong.durationSec || 0) / 60);
            const seconds = Math.floor((selectedSong.durationSec || 0) % 60);
            const duration = `${minutes}:${String(seconds).padStart(2, '0')}`;
            Alert.alert('Song Details', `Title: ${selectedSong.title}\nArtist: ${selectedSong.artist}\nAlbum: ${selectedSong.album || 'Unknown'}\nDuration: ${duration}`);
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shuffleRepeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginHorizontal: -20,
    marginTop: 4,
  },
  shuffleRepeatButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shuffleRepeatSpacer: {
    flex: 1,
  },
  repeatOneIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatOneText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '700',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 20,
    paddingBottom: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    marginRight: 12,
  },
  rowActive: {
    opacity: 0.7,
  },
  rowPlaying: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  rowNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowNumberText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '700',
  },
  rowNumberTextActive: {
    color: colors.primary,
    fontSize: 16,
  },
  rowMeta: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  titleActive: {
    color: colors.primary,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  remove: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    marginLeft: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 24,
    fontWeight: '400',
  },
  cta: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  ctaText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
});
