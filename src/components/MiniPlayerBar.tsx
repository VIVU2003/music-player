import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { usePlayerStore } from '../state/playerStore';
import { colors } from '../theme/colors';

export function MiniPlayerBar() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const song = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const toggle = usePlayerStore((s) => s.togglePlayPause);
  const nextWithoutPlay = usePlayerStore((s) => s.nextWithoutPlay);
  const [isPlayerScreen, setIsPlayerScreen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<string>('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      const state = navigation.getState();
      if (state) {
        const route = state.routes[state.index];
        const screenName = route?.name || '';
        setIsPlayerScreen(screenName === 'Player');
        setCurrentScreen(screenName);
      }
    });

    const state = navigation.getState();
    if (state) {
      const route = state.routes[state.index];
      const screenName = route?.name || '';
      setIsPlayerScreen(screenName === 'Player');
      setCurrentScreen(screenName);
    }

    return unsubscribe;
  }, [navigation]);

  if (!song || isPlayerScreen) return null;

  const tabBarHeight = Platform.OS === 'ios' ? 88 : 64;
  const isQueueScreen = currentScreen === 'Queue';
  const bottomOffset = isQueueScreen ? insets.bottom : tabBarHeight;

  return (
    <View
      style={[styles.wrap, { bottom: bottomOffset }]}
      pointerEvents="box-none"
      collapsable={false}
    >
      <Pressable
        style={styles.bar}
        onPress={() => navigation.navigate('Player')}
        android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
      >
        <View style={styles.artContainer}>
          {song.artworkUrl ? (
            <Image source={{ uri: song.artworkUrl }} style={styles.art} resizeMode="cover" />
          ) : (
            <View style={[styles.art, styles.artPlaceholder]}>
              <Ionicons name="musical-notes" size={20} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.title}>
            {song.title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {song.artist}
          </Text>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            void toggle();
          }}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color={colors.text}
            style={{ marginLeft: isPlaying ? 0 : 2 }}
          />
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            void nextWithoutPlay();
          }}
          style={styles.nextButton}
          accessibilityRole="button"
          accessibilityLabel="Next song"
        >
          <Ionicons name="play-skip-forward" size={22} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  artContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    marginRight: 12,
  },
  art: {
    width: '100%',
    height: '100%',
  },
  artPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  nextButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
