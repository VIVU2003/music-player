import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { PlaylistsScreen } from '../screens/PlaylistsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HomeStack } from './HomeStack';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            const state = navigation.getState();
            const currentTabIndex = state.index;
            const isHomeTabActive = state.routes[currentTabIndex]?.name === 'HomeStack';
            
            if (isHomeTabActive) {
              const homeTabRoute = state.routes.find((r) => r.name === 'HomeStack');
              const homeStackState = homeTabRoute?.state;
              
              if (homeStackState && typeof homeStackState.index === 'number' && homeStackState.index > 0) {
                e.preventDefault();
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [
                      {
                        name: 'HomeStack',
                        state: {
                          routes: [{ name: 'HomeMain' }],
                          index: 0,
                        },
                      },
                    ],
                  })
                );
              } else {
                e.preventDefault();
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'HomeStack',
                    params: {
                      screen: 'HomeMain',
                      params: { resetToSuggested: true, timestamp: Date.now() },
                    },
                  })
                );
              }
            }
          },
        })}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
      <Tab.Screen
        name="Playlists"
        component={PlaylistsScreen}
        options={{
          tabBarLabel: 'Playlists',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'list' : 'list-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size || 24}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
      />
    </Tab.Navigator>
  );
}
