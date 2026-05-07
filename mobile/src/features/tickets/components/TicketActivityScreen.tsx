/**
 * TicketActivityScreen — Full-screen premium activity timeline for a specific ticket.
 *
 * This screen provides a dedicated, airy view of all activities related to a ticket.
 * It follows the "Maximized" design language with large typography and generous spacing.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing, Palette } from '@/src/constants/tokens';
import { useThemeColors } from '@/src/constants/theme';
import { useTicketDetail } from '@/src/features/tickets/hooks/useTicketDetail';
import { getActivityConfig } from '@/src/features/dashboard/utils/activityConfig';
import type { TicketActivity } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatDateGroup(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const ActivityTimelineItem: React.FC<{
  activity: TicketActivity;
  isFirst: boolean;
  isLast: boolean;
  index: number;
  resolvedColors: any;
}> = ({ activity, isFirst, isLast, index, resolvedColors: c }) => {
  const config = getActivityConfig(activity.action, activity.description, activity.id);
  const accentColor = config.color;
  const iconName = (config.icon.replace('-outline', '') as any);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      layout={Layout.springify()}
      style={styles.itemContainer}
    >
      <View style={styles.timelineColumn}>
        <View style={[styles.timelineLine, { backgroundColor: c.border.primary, opacity: isFirst ? 0 : 0.3, height: 16 }]} />
        <View style={[styles.iconNode, { backgroundColor: `${accentColor}10`, borderColor: accentColor }]}>
          <Ionicons name={iconName} size={14} color={accentColor} />
        </View>
        <View style={[styles.timelineLine, { backgroundColor: c.border.primary, opacity: isLast ? 0 : 0.3, flex: 1 }]} />
      </View>

      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.actorName, { color: c.text.primary }]}>
            {activity.user?.name ?? 'System'}
          </Text>
          <Text style={[styles.timestamp, { color: c.text.muted }]}>
            {formatRelativeTime(activity.createdAt)}
          </Text>
        </View>

        <Text style={[styles.actionLabel, { color: accentColor }]}>
          {activity.action.replace(/_/g, ' ')}
        </Text>

        <Text style={[styles.description, { color: c.text.secondary }]}>
          {activity.description}
        </Text>

        {(activity.oldValue || activity.newValue) && (
          <View style={[styles.changeLog, { backgroundColor: c.surface.secondary, borderColor: c.border.primary }]}>
            {activity.oldValue && (
              <Text style={[styles.changeText, { color: c.text.muted }]}>
                From: <Text style={{ color: c.text.primary, fontWeight: FontWeight.semibold }}>{activity.oldValue}</Text>
              </Text>
            )}
            {activity.newValue && (
              <Text style={[styles.changeText, { color: c.text.muted }]}>
                To: <Text style={{ color: c.text.primary, fontWeight: FontWeight.semibold }}>{activity.newValue}</Text>
              </Text>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketActivityScreen: React.FC<{ ticketId: string; onBack: () => void }> = ({
  ticketId,
  onBack,
}) => {
  const c = useThemeColors();
  const { ticket, activities, isLoading } = useTicketDetail(ticketId);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { date: string; data: TicketActivity[] }[] = [];
    activities.forEach((activity) => {
      const dateKey = formatDateGroup(activity.createdAt);
      const existing = groups.find((g) => g.date === dateKey);
      if (existing) {
        existing.data.push(activity);
      } else {
        groups.push({ date: dateKey, data: [activity] });
      }
    });
    return groups;
  }, [activities]);

  const flatData = useMemo(() => {
    const data: (string | TicketActivity)[] = [];
    groupedActivities.forEach((group) => {
      data.push(group.date);
      data.push(...group.data);
    });
    return data;
  }, [groupedActivities]);

  return (
    <View style={[styles.root, { backgroundColor: c.surface.primary }]}>
      <View style={[styles.header, { backgroundColor: c.surface.header }]}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Activity</Text>
            {ticket && <Text style={styles.headerSub} numberOfLines={1}>{ticket.title}</Text>}
          </View>
        </View>

      <FlatList
        data={flatData}
        keyExtractor={(item, index) => (typeof item === 'string' ? item : item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          if (typeof item === 'string') {
            return (
              <Animated.View entering={FadeIn.delay(index * 50)} style={styles.dateHeader}>
                <View style={[styles.dateLine, { backgroundColor: c.border.primary }]} />
                <Text style={[styles.dateText, { color: c.text.muted, backgroundColor: c.surface.primary }]}>
                  {item}
                </Text>
              </Animated.View>
            );
          }
          return (
            <ActivityTimelineItem
              activity={item}
              index={index}
              isFirst={index === 0 || typeof flatData[index - 1] === 'string'}
              isLast={index === flatData.length - 1 || typeof flatData[index + 1] === 'string'}
              resolvedColors={c}
            />
          );
        }}
        ListHeaderComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={c.interactive.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={c.text.muted} />
              <Text style={[styles.emptyTitle, { color: c.text.primary }]}>No history yet</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: '#ffffff',
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    justifyContent: 'center',
  },
  dateLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.md,
  },
  itemContainer: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineColumn: {
    width: 32,
    alignItems: 'center',
  },
  timelineLine: { width: 2 },
  iconNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    paddingBottom: Spacing.xl,
    paddingLeft: Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  actorName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.6,
  },
  actionLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    opacity: 0.8,
  },
  description: {
    fontSize: FontSize.sm,
    lineHeight: 18,
    opacity: 0.9,
  },
  changeLog: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 2,
  },
  changeText: { fontSize: 11 },
  loadingContainer: { paddingVertical: 100, alignItems: 'center' },
  emptyContainer: {
    paddingVertical: 120,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
});

export default TicketActivityScreen;
