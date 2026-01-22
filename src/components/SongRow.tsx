import { Pressable, StyleSheet, Text, View, Image } from 'react-native';

import type { Song } from '../types/music';
import { formatTime } from '../utils/time';

export function SongRow(props: { song: Song; onPress: () => void; right?: React.ReactNode }) {
  const { song } = props;
  return (
    <Pressable onPress={props.onPress} style={styles.row}>
      <View style={styles.artContainer}>
        <Image
          source={song.artworkUrl ? { uri: song.artworkUrl } : undefined}
          style={styles.art}
          accessibilityLabel="Artwork"
        />
        <View style={styles.playOverlay}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </View>
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.title}>
          {song.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {song.artist}
        </Text>
        {song.durationSec && (
          <Text style={styles.duration}>{formatTime(song.durationSec)}</Text>
        )}
      </View>
      <View style={styles.right}>{props.right}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14141A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  artContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A24',
  },
  art: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  meta: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  duration: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  right: {
    marginLeft: 12,
  },
});
