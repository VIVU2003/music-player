import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MiniPlayerBar } from './src/components/MiniPlayerBar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { usePlayerStore } from './src/state/playerStore';

export default function App() {
  const initAudio = usePlayerStore((s) => s.initAudio);

  useEffect(() => {
    initAudio();
  }, [initAudio]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
    <View style={styles.container}>
            <RootNavigator />
            <MiniPlayerBar />
    </View>
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
});
