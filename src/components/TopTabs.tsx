import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type Tab = 'Suggested' | 'Songs' | 'Artists' | 'Albums' | 'Folders';

type TopTabsProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export function TopTabs({ activeTab, onTabChange }: TopTabsProps) {
  const tabs: Tab[] = ['Suggested', 'Songs', 'Artists', 'Albums', 'Folders'];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onTabChange(tab)}
          style={styles.tab}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab}
          </Text>
          {activeTab === tab && <View style={styles.indicator} />}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    marginRight: 24,
    paddingVertical: 8,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
});
