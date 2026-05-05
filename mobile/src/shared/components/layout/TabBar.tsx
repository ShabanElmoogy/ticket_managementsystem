/**
 * TabBar / SubTabBar — generic icon+label tab selectors.
 *
 * TabBar    — filled pill, horizontal scroll. Use as a primary screen-level tab bar.
 * SubTabBar — outlined chip row. Use as a secondary section-level tab bar.
 *
 * @usedIn
 *   - SettingsScreen (primary + secondary)
 *   - ReportsScreen  (or any screen needing a tab selector)
 *
 * @modalSafety ❌ NOT Modal-safe — calls useThemeColors() internally.
 */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import type { IoniconName } from '@/src/components/layout/header/navItems';

export interface TabItem {
  id:    string;
  label: string;
  icon:  IoniconName;
}

// ── TabBar — filled pill, horizontal scroll ───────────────────────────────────

export interface TabBarProps {
  tabs:     TabItem[];
  active:   string;
  onSelect: (id: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, active, onSelect }) => {
  const c = useThemeColors();
  return (
    <View style={[styles.mainBar, { borderBottomColor: c.border.primary, backgroundColor: c.surface.primary }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mainScroll}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelect(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={[
                styles.mainChip,
                {
                  backgroundColor: isActive ? c.tint          : c.surface.tertiary,
                  borderColor:     isActive ? c.tint          : c.border.primary,
                },
              ]}
            >
              <Ionicons name={tab.icon} size={15} color={isActive ? c.text.inverse : c.text.secondary} />
              <Text style={[styles.mainLabel, { color: isActive ? c.text.inverse : c.text.secondary }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ── SubTabBar — outlined chip row ─────────────────────────────────────────────

export interface SubTabBarProps {
  tabs:     TabItem[];
  active:   string;
  onSelect: (id: string) => void;
}

export const SubTabBar: React.FC<SubTabBarProps> = ({ tabs, active, onSelect }) => {
  const c = useThemeColors();
  return (
    <View style={[styles.subBar, { borderBottomColor: c.border.primary }]}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onSelect(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[
              styles.subChip,
              {
                backgroundColor: isActive ? c.tint + '18' : 'transparent',
                borderColor:     isActive ? c.tint         : c.border.primary,
              },
            ]}
          >
            <Ionicons name={tab.icon} size={13} color={isActive ? c.tint : c.text.secondary} />
            <Text style={[styles.subLabel, { color: isActive ? c.tint : c.text.secondary }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  mainBar:    { borderBottomWidth: 1 },
  mainScroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row' },
  mainChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  mainLabel:  { fontSize: 12, fontWeight: '600' },

  subBar:   { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  subChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  subLabel: { fontSize: 12, fontWeight: '600' },
});
