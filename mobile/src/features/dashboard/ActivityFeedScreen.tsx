/**
 * ActivityFeedScreen — Full-screen activity feed with fixed header.
 *
 * Opened when the user taps the bell icon in the app header.
 * Fixed header with back button + title + unread count badge.
 * Scrollable list of ActivityFeedItem below.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
// @ts-ignore
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';
import { Spacing, Radius, FontSize, FontWeight, Palette } from '@/src/constants/tokens';
import { useActivityFeed } from './hooks/useActivityFeed';
import ActivityFeedPanel from './components/ActivityFeedPanel';

const ActivityFeedScreen: React.FC = () => {
  const c         = useThemeColors();
  const router    = useRouter();
  const clearUnread = useUiStore((s) => s.clearUnread);

  // Clear the bell badge when this screen opens
  useEffect(() => {
    clearUnread();
  }, [clearUnread]);

  const {
    activities,
    unreadCount,
    loading,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setSearchQuery,
    filterExpanded,
    setFilterExpanded,
    markRead,
    markUnread,
    markAllRead,
    markAllUnread,
    clearAll,
    typeCounts,
  } = useActivityFeed();

  const handleItemPress = (activity: any) => {
    if (activity?.data?.ticket?.id) {
      router.back();
      // Navigate to ticket detail after going back
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: c.surface.primary }]}>

      {/* ── Fixed header ──────────────────────────────────────────────── */}
      <SafeAreaView style={[styles.headerSafe, { backgroundColor: c.surface.header }]}>
        <View style={[styles.header, { backgroundColor: c.surface.header }]}>

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: pressed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back-outline" size={20} color="#ffffff" />
          </Pressable>

          {/* Title */}
          <View style={styles.titleRow}>
            <Ionicons name="notifications-outline" size={18} color="#ffffff" style={{ marginEnd: 6 }} />
            <Text style={styles.title}>Activity Feed</Text>
          </View>

          {/* Mark all read */}
          <Pressable
            onPress={markAllRead}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: pressed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
          >
            <Ionicons name="checkmark-done-outline" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ActivityFeedPanel
          activities={activities}
          unreadCount={unreadCount}
          loading={loading}
          isExpanded
          filterExpanded={filterExpanded}
          typeFilter={typeFilter}
          searchQuery={searchQuery}
          typeCounts={typeCounts}
          onMarkAllRead={markAllRead}
          onMarkAllUnread={markAllUnread}
          onClearAll={clearAll}
          onToggleExpand={() => {}}
          onToggleFilter={() => setFilterExpanded((v) => !v)}
          onTypeFilter={setTypeFilter}
          onSearchChange={setSearchQuery}
          onMarkRead={markRead}
          onMarkUnread={markUnread}
          onItemPress={handleItemPress}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerSafe: {
    // SafeAreaView handles top inset
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    gap:               Spacing.sm,
  },
  backBtn: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  titleRow: {
    flex:        1,
    flexDirection: 'row',
    alignItems:  'center',
  },
  title: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
    color:      '#ffffff',
  },
  badge: {
    marginStart:       6,
    minWidth:          20,
    height:            20,
    borderRadius:      10,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize:   10,
    fontWeight: FontWeight.bold,
    color:      '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
});

export default ActivityFeedScreen;
