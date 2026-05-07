/**
 * ActivityFeedPanel — Collapsible real-time activity feed panel.
 *
 * Composes:
 *   - ActivityFeedHeader  (bell, title, action buttons, rainbow line)
 *   - ActivityTypeFilter  (9 filter chips with count badges)
 *   - Search input
 *   - FlatList of ActivityFeedItem
 *
 * ✅ Uses `c.*` tokens from `useThemeColors()` — screen only (not Modal-safe).
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native') as any;
const FlatList = RN.FlatList as any;
const TextInput = RN.TextInput as any;
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import type { ActivityItem } from '@/src/services/api/types/notification';
import type { ActivityTypeFilter as ActivityTypeFilterType } from '@/src/features/dashboard/hooks/useActivityFeed';

// Sub-components
import ActivityFeedHeader from './activityFeed/ActivityFeedHeader';
import ActivityTypeFilter from './activityFeed/ActivityTypeFilter';
import ActivityFeedItem from '@/src/shared/components/display/ActivityFeedItem';

// ─────────────────────────────────────────────────────────────────────────────
// FadeInItem wrapper — plain View fallback (Animated.View from require is unreliable)
// ─────────────────────────────────────────────────────────────────────────────

const FadeInItem = ({ children }: { children?: React.ReactNode }) => (
  <View>{children}</View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

const EmptyActivities: React.FC<{
  c: ReturnType<typeof useThemeColors>;
  hasSearch: boolean;
}> = ({ c, hasSearch }) => (
  <View style={styles.emptyState}>
    <View style={[styles.emptyIconBadge, { backgroundColor: c.surface.elevated }]}>
      <Ionicons
        name={hasSearch ? 'search-outline' : 'notifications-outline'}
        size={32}
        color={c.text.muted}
      />
    </View>
    <Text style={[styles.emptyTitle, { color: c.text.primary }]}>
      {hasSearch ? 'No matching activities' : 'No activities yet'}
    </Text>
    <Text style={[styles.emptySubtitle, { color: c.text.muted }]}>
      {hasSearch
        ? 'Try adjusting your search or filters'
        : 'Activities will appear here when tickets are updated'}
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ActivityFeedPanelProps {
  activities:      ActivityItem[];
  unreadCount:     number;
  loading:         boolean;
  isExpanded:      boolean;
  filterExpanded:  boolean;
  typeFilter:      ActivityTypeFilterType;
  searchQuery:     string;
  typeCounts:      Record<string, number>;
  onMarkAllRead:   () => void;
  onMarkAllUnread: () => void;
  onClearAll:      () => void;
  onToggleExpand:  () => void;
  onToggleFilter:  () => void;
  onTypeFilter:    (filter: ActivityTypeFilterType) => void;
  onSearchChange:  (q: string) => void;
  onMarkRead:      (id: string) => void;
  onMarkUnread:    (id: string) => void;
  onItemPress:     (activity: ActivityItem) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ActivityFeedPanel: React.FC<ActivityFeedPanelProps> = ({
  activities,
  unreadCount,
  loading,
  isExpanded,
  filterExpanded,
  typeFilter,
  searchQuery,
  typeCounts,
  onMarkAllRead,
  onMarkAllUnread,
  onClearAll,
  onToggleExpand,
  onToggleFilter,
  onTypeFilter,
  onSearchChange,
  onMarkRead,
  onMarkUnread,
  onItemPress,
}) => {
  const c = useThemeColors();

  const renderItem = useCallback(({ item }: { item: ActivityItem }) => (
    <FadeInItem>
      <ActivityFeedItem
        activity={item}
        resolvedColors={c}
        onPress={onItemPress}
        onMarkRead={onMarkRead}
        onMarkUnread={onMarkUnread}
      />
    </FadeInItem>
  ), [c, onItemPress, onMarkRead, onMarkUnread]);

  const keyExtractor = useCallback((item: ActivityItem) => item.id, []);

  const hasSearch = !!searchQuery.trim() || typeFilter !== 'ALL';

  return (
    <View style={[styles.container, { backgroundColor: c.surface.card, borderColor: c.border.primary }]}>

      {/* Header */}
      <ActivityFeedHeader
        unreadCount={unreadCount}
        isExpanded={isExpanded}
        onMarkAllRead={onMarkAllRead}
        onMarkAllUnread={onMarkAllUnread}
        onClearAll={onClearAll}
        onToggleExpand={onToggleExpand}
      />

      {/* Expanded content */}
      {isExpanded && (
        <View>
          {/* Type filter chips */}
          <ActivityTypeFilter
            activeFilter={typeFilter}
            typeCounts={typeCounts}
            isExpanded={filterExpanded}
            onFilterChange={onTypeFilter}
            onToggleExpand={onToggleFilter}
          />

          {/* Search input */}
          <View style={[styles.searchRow, { borderBottomColor: c.border.primary }]}>
            <View style={[styles.searchInputWrapper, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}>
              <Ionicons name="search-outline" size={16} color={c.text.muted} />
              <TextInput
                value={searchQuery}
                onChangeText={onSearchChange}
                placeholder="Search activities..."
                placeholderTextColor={c.text.muted}
                style={[styles.searchInput, { color: c.text.primary }]}
              />
              {searchQuery.length > 0 && (
                <Ionicons
                  name="close-outline"
                  size={16}
                  color={c.text.muted}
                  onPress={() => onSearchChange('')}
                />
              )}
            </View>
          </View>

          {/* Activity list */}
          <FlatList
            data={activities}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
            ListEmptyComponent={<EmptyActivities c={c} hasSearch={hasSearch} />}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderWidth:       1,
    borderRadius:      Radius.xl,
    overflow:          'hidden',
    marginHorizontal:  Spacing.md,
    marginVertical:    Spacing.sm,
    shadowColor:       'rgba(0,0,0,0.08)',
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     1,
    shadowRadius:      8,
    elevation:         3,
  },
  searchRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.sm,
    borderWidth:       1,
    borderRadius:      Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs,
  },
  searchInput: {
    flex:     1,
    fontSize: FontSize.sm,
  },
  listContent: {
    paddingBottom: Spacing.sm,
  },
  // Empty state
  emptyState: {
    alignItems:      'center',
    paddingVertical: Spacing.xl,
    gap:             Spacing.sm,
  },
  emptyIconBadge: {
    width:          64,
    height:         64,
    borderRadius:   32,
    alignItems:     'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  emptySubtitle: {
    fontSize:  FontSize.sm,
    textAlign: 'center',
    maxWidth:  240,
  },
});

export default ActivityFeedPanel;
