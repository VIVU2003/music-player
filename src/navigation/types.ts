import type { HomeStackParamList } from './HomeStack';

export type RootStackParamList = {
  MainTabs: undefined;
  Player: undefined;
  Queue: undefined;
};

export type MainTabParamList = {
  HomeStack: { screen?: keyof HomeStackParamList; params?: HomeStackParamList[keyof HomeStackParamList] } | undefined;
  Favorites: undefined;
  Playlists: undefined;
  Settings: undefined;
};

export type { HomeStackParamList };
