import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AlbumDetailScreen } from '../screens/AlbumDetailScreen';
import { ArtistDetailScreen } from '../screens/ArtistDetailScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { SearchResultsScreen } from '../screens/SearchResultsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { colors } from '../theme/colors';

export type HomeStackParamList = {
  HomeMain: { resetToSuggested?: boolean; timestamp?: number } | undefined;
  Search: undefined;
  SearchResults: { query: string; category?: string };
  Artist: { artistId: string; artistName: string };
  Album: { albumId: string; albumName: string; artistName?: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      <Stack.Screen name="Artist" component={ArtistDetailScreen} />
      <Stack.Screen name="Album" component={AlbumDetailScreen} />
    </Stack.Navigator>
  );
}
