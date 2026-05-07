/**
 * ActivityTab — Activity timeline tab in the Ticket Detail screen.
 *
 * Renders a FlatList of ActivityFeedItem components mapped from TicketActivity.
 * Shows empty state when no activities, skeleton loading state while fetching.
 *
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native') as any;
const FlatList = RN.FlatList as any;
import { Ionicons } from '@expo/vector-icons';
import { Spacing, FontSize } from '@/src/constants/tokens';
import ActivityFeedItem from '@/src/shared/components/display/ActivityFeedItem';
import type { ThemeColors } from '@/src/constants/tokens';
import type { TicketActivity } from '@/src/services/api/types/ticket';
import type { ActivityItem } from '@/src/services/api/types/notification';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toActivityItem(a: TicketActivity): ActivityItem {
  return {
    id: a.id,
    type: (a.action as any) ?? 'TICKET_UPDATED',
    data: {
      ticket: { id: a.ticketId, title: '' },
      description: a.description,
      createdBy: a.user?.name,
      newStatus: a.newValue,
    },
    timestamp: a.createdAt,
    read: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ActivityTabProps {
  activities: TicketActivity[];
  resolvedColors: ThemeColors;
  isLoading: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ActivityTab: React.FC<ActivityTabProps> = ({
  activities,
  resolvedColors: c,
  isLoading,
}) => {
  // Loading state — show 3 skeleton items
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: c.surface.primary }]}>
        <View style={styles.listContent}>
          {[1, 2, 3].map((i) => (
            <View key={i}>
              <ActivityFeedItem
                activity={{
                  id: String(i),
                  type: 'TICKET_UPDATED',
                  data: {},
                  timestamp: new Date().toISOString(),
                  read: true,
                }}
                resolvedColors={c}
                onPress={() => {}}
                onMarkRead={() => {}}
                onMarkUnread={() => {}}
                isLoading
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={activities}
       keyExtractor={(item: TicketActivity) => item.id}
      style={[styles.container, { backgroundColor: c.surface.primary }]}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }: { item: TicketActivity }) => (
        <ActivityFeedItem
          activity={toActivityItem(item)}
          resolvedColors={c}
          onPress={() => {}}
          onMarkRead={() => {}}
          onMarkUnread={() => {}}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={40} color={c.text.muted} />
          <Text style={[styles.emptyText, { color: c.text.muted }]}>
            No activity recorded yet
          </Text>
        </View>
      }
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    gap: 8,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: FontSize.sm,
  },
});

export default ActivityTab;
