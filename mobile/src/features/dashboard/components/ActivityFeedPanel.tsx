
import React, { useCallback } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ListRenderItem,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native') as any;
const FlatList = RN.FlatList as any;

import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/src/constants/theme';

import {
  Spacing,
  Radius,
  FontSize,
  FontWeight,
} from '@/src/constants/tokens';

import type { ActivityItem } from '@/src/services/api/types/notification';

import type {
  ActivityTypeFilter as ActivityTypeFilterType,
} from '@/src/features/dashboard/hooks/useActivityFeed';

import ActivityFeedHeader from './activityFeed/ActivityFeedHeader';
import ActivityFeedItem from '@/src/shared/components/display/ActivityFeedItem';
import { ActivityTypeFilter } from './activityFeed/ActivityTypeFilter';

interface ActivityFeedPanelProps {
  activities: ActivityItem[];
  unreadCount: number;
  loading: boolean;

  isExpanded: boolean;
  filterExpanded: boolean;

  typeFilter: ActivityTypeFilterType;
  searchQuery: string;

  typeCounts: Record<string, number>;

  onMarkAllRead: () => void;
  onMarkAllUnread: () => void;
  onClearAll: () => void;

  onToggleExpand: () => void;
  onToggleFilter: () => void;

  onTypeFilter: (
    filter: ActivityTypeFilterType
  ) => void;

  onSearchChange: (q: string) => void;

  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;

  onItemPress: (
    activity: ActivityItem
  ) => void;
}

const FadeInItem = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  return (
    <View>
      {children}
    </View>
  );
};

const ActivityFeedPanel: React.FC<ActivityFeedPanelProps> = ({
  activities,
  unreadCount,

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

  const renderItem: ListRenderItem<ActivityItem> =
    useCallback(
      ({ item }) => {
        return (
          <FadeInItem>
            <ActivityFeedItem
              activity={item}
              resolvedColors={c}
              onPress={onItemPress}
              onMarkRead={onMarkRead}
              onMarkUnread={onMarkUnread}
            />
          </FadeInItem>
        );
      },
      [
        c,
        onItemPress,
        onMarkRead,
        onMarkUnread,
      ]
    );

  const keyExtractor = useCallback(
    (item: ActivityItem) => item.id,
    []
  );

  const hasSearch =
    searchQuery.trim().length > 0 ||
    typeFilter !== 'ALL';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.surface.card,
          borderColor: c.border.primary,
        },
      ]}
    >

      <ActivityFeedHeader
        unreadCount={unreadCount}
        isExpanded={isExpanded}
        onMarkAllRead={onMarkAllRead}
        onMarkAllUnread={onMarkAllUnread}
        onClearAll={onClearAll}
        onToggleExpand={onToggleExpand}
      />

      {isExpanded && (
        <View>

          <ActivityTypeFilter
            activeFilter={typeFilter}
            typeCounts={typeCounts}
            isExpanded={filterExpanded}
            onFilterChange={onTypeFilter}
            onToggleExpand={onToggleFilter}
          /> 

          <View
            style={[
              styles.searchRow,
              {
                borderBottomColor:
                  c.border.primary,
              },
            ]}
          >
            <View
              style={[
                styles.searchInputWrapper,
                {
                  backgroundColor:
                    c.surface.elevated,
                  borderColor:
                    c.border.primary,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={16}
                color={c.text.muted}
              />

              <TextInput
                value={searchQuery}
                onChangeText={onSearchChange}
                placeholder="Search activities..."
                placeholderTextColor={
                  c.text.muted
                }
                style={[
                  styles.searchInput,
                  {
                    color: c.text.primary,
                  },
                ]}
              />

              {searchQuery.length > 0 && (
                <Ionicons
                  name="close-outline"
                  size={16}
                  color={c.text.muted}
                  onPress={() =>
                    onSearchChange('')
                  }
                />
              )}
            </View>
          </View>

          <FlatList
            data={activities}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
            contentContainerStyle={
              styles.listContent
            }
            ListEmptyComponent={
              <View
                style={styles.emptyState}
              >
                <Text
                  style={{
                    color:
                      c.text.muted,
                  }}
                >
                  {hasSearch
                    ? 'No matching activities'
                    : 'No activities yet'}
                </Text>
              </View>
            }
          />

        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',

    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },

  searchRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,

    borderBottomWidth: 1,
  },

  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: Spacing.sm,

    borderWidth: 1,
    borderRadius: Radius.lg,

    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },

  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
  },

  listContent: {
    paddingBottom: Spacing.sm,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
});

export default ActivityFeedPanel;

