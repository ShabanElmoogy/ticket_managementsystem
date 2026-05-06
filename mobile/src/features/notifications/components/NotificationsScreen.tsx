/**
 * NotificationsScreen
 *
 * Displays the full notification list for the authenticated user.
 *
 * Behaviour:
 *   - Fetches notifications via React Query on mount.
 *   - Calls `notificationService.markAllAsRead()` on mount to clear the badge
 *     and mark all notifications as read in the backend.
 *   - Pull-to-refresh triggers a React Query refetch.
 *   - Each row shows a type icon, title (bold if unread), message, and relative
 *     timestamp. Unread rows have a 3px `c.interactive.primary` left border.
 *   - Tapping a row marks it as read and navigates to the deep-link target.
 *   - Empty state uses `AppEmptyState` with `notifications-outline` icon.
 *   - Loading state shows a centred `ActivityIndicator`.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors, FontSize, Spacing, Radius } from '@/src/constants/theme';
import AppEmptyState from '@/src/shared/components/feedback/AppEmptyState';
import { formatRelativeDuration } from '@/src/shared/utils/dateUtils';

import { notificationsApi, notificationsKeys } from '../api/notifications';
import { notificationService } from '../services/NotificationService';
import type { NotificationItem } from '../types/types';
import type { NotificationType } from '@/src/services/api/types/notification';

// ─────────────────────────────────────────────────────────────────────────────
// Type icon mapping (per design spec)
// ─────────────────────────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TypeIconConfig {
  icon:  IoniconName;
  color: (c: ReturnType<typeof useThemeColors>) => string;
}

const TYPE_ICON_MAP: Record<NotificationType, TypeIconConfig> = {
  TICKET_CREATED:              { icon: 'ticket-outline',            color: (c) => c.interactive.primary },
  TICKET_UPDATED:              { icon: 'create-outline',            color: (c) => c.intent.info },
  TICKET_ASSIGNED:             { icon: 'person-outline',            color: (c) => c.intent.info },
  COMMENT_ADDED:               { icon: 'chatbubble-outline',        color: (c) => c.intent.success },
  COMMENT_MENTION:             { icon: 'at-outline',                color: (c) => c.intent.warning },
  COMMENT_DELETED:             { icon: 'trash-outline',             color: (c) => c.intent.error },
  STATUS_CHANGED:              { icon: 'swap-horizontal-outline',   color: (c) => c.intent.info },
  PRIORITY_ESCALATED:          { icon: 'arrow-up-circle-outline',   color: (c) => c.intent.error },
  TICKET_DUE_SOON:             { icon: 'time-outline',              color: (c) => c.intent.warning },
  TICKET_OVERDUE:              { icon: 'warning-outline',           color: (c) => c.intent.error },
  EPIC_FEATURE_STATUS_CHANGED: { icon: 'git-branch-outline',        color: (c) => c.intent.info },
};

const DEFAULT_ICON_CONFIG: TypeIconConfig = {
  icon:  'notifications-outline',
  color: (c) => c.interactive.primary,
};

// ─────────────────────────────────────────────────────────────────────────────
// NotificationRow
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationRowProps {
  item:    NotificationItem;
  onPress: (item: NotificationItem) => void;
}

const NotificationRow: React.FC<NotificationRowProps> = ({ item, onPress }) => {
  const c          = useThemeColors();
  const iconConfig = TYPE_ICON_MAP[item.type] ?? DEFAULT_ICON_CONFIG;
  const iconColor  = iconConfig.color(c);

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor:  pressed ? c.interactive.pressed : c.surface.card,
          borderLeftColor:  item.read ? 'transparent' : c.interactive.primary,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      {/* Type icon */}
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={iconConfig.icon} size={20} color={iconColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                color:      item.read ? c.text.muted : c.text.primary,
                fontWeight: item.read ? '400' : '700',
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.timestamp, { color: c.text.muted }]}>
            {formatRelativeDuration(item.createdAt)}
          </Text>
        </View>

        <Text
          style={[styles.message, { color: item.read ? c.text.muted : c.text.secondary }]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
      </View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsScreen
// ─────────────────────────────────────────────────────────────────────────────

const NotificationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const c     = useThemeColors();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data:       notifications = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: notificationsKeys.all,
    queryFn:  notificationsApi.getNotifications.bind(notificationsApi),
  });

  // ── Mark all as read on mount ──────────────────────────────────────────────
  useEffect(() => {
    notificationService.markAllAsRead().catch(() => {});
  }, []);

  // ── Row tap handler ────────────────────────────────────────────────────────
  const handleRowPress = useCallback((item: NotificationItem) => {
    // Mark as read on the backend + in the store
    notificationService.markAsRead(item.id).catch(() => {});

    // Navigate to the deep-link target
    const screen = item.data?.screen;
    const params = item.data?.params;

    try {
      switch (screen) {
        case 'ticket-detail':
          if (params?.ticketId) {
            router.push({
              pathname: '/(app)/ticket/[id]',
              params:   { id: params.ticketId },
            } as any);
          } else {
            router.push('/(app)/notifications');
          }
          break;
        case 'dashboard':
          router.push('/(app)/' as any);
          break;
        case 'notifications':
        default:
          // Already on notifications — no navigation needed
          break;
      }
    } catch {
      // Navigation failed — stay on notifications screen
    }
  }, []);

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <NotificationRow item={item} onPress={handleRowPress} />
    ),
    [handleRowPress]
  );

  const keyExtractor = useCallback((item: NotificationItem) => item.id, []);

  const ItemSeparator = useCallback(
    () => <View style={[styles.separator, { backgroundColor: c.border.primary }]} />,
    [c.border.primary]
  );

  // ── Loading state (initial load, list is empty) ────────────────────────────
  if (isLoading && notifications.length === 0) {
    return (
      <View style={[styles.centred, { backgroundColor: c.surface.primary }]}>
        <ActivityIndicator size="large" color={c.interactive.primary} />
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: c.surface.primary }]}>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={c.interactive.primary}
            colors={[c.interactive.primary]}
          />
        }
        ListEmptyComponent={
          <AppEmptyState
            ionicon="notifications-outline"
            ioniconColor={c.text.muted}
            ioniconSize={52}
            message={t('notifications.emptyMessage')}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centred: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  listContent: {
    paddingVertical: Spacing[2],
  },
  emptyContainer: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: Spacing[8],
  },
  row: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    paddingVertical: Spacing[3],
    paddingEnd:      Spacing[4],
    paddingStart:    Spacing[4],
    borderLeftWidth: 3,
  },
  iconContainer: {
    width:          40,
    height:         40,
    borderRadius:   Radius.full,
    alignItems:     'center',
    justifyContent: 'center',
    marginEnd:      Spacing[3],
    flexShrink:     0,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing[1],
  },
  title: {
    flex:     1,
    fontSize: FontSize.sm,
    marginEnd: Spacing[2],
  },
  timestamp: {
    fontSize:  FontSize.xs,
    flexShrink: 0,
  },
  message: {
    fontSize:   FontSize.sm,
    lineHeight: FontSize.sm * 1.4,
  },
  separator: {
    height:      StyleSheet.hairlineWidth,
    marginStart: Spacing[4] + 40 + Spacing[3], // align with content start
  },
});

export default NotificationsScreen;
