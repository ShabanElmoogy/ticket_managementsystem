/**
 * activityConfig.ts — Activity type → label/icon/color/filterKey/width config map.
 *
 * Pure module-level constants. No React hooks, no API calls.
 * Colors use Palette.* constants — never hardcoded hex.
 */

import { Palette } from '@/src/constants/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ActivityTypeConfig {
  label: string;
  icon: string; // IoniconName
  color: string; // Palette.* constant
  filterKey: string;
  width: 'full' | 'half';
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY_TYPE_CONFIG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps each activity type string to its display configuration.
 *
 * Used by ActivityTypeFilter chips and ActivityFeedItem rendering.
 */
export const ACTIVITY_TYPE_CONFIG: Record<string, ActivityTypeConfig> = {
  TICKET_CREATED: {
    label: 'New Tickets',
    icon: 'ticket-outline',
    color: Palette.emerald500,
    filterKey: 'TICKET_CREATED',
    width: 'half',
  },
  TICKET_UPDATED: {
    label: 'Updated Tickets',
    icon: 'refresh-outline',
    color: Palette.amber500,
    filterKey: 'TICKET_UPDATED',
    width: 'full',
  },
  TICKET_ASSIGNED: {
    label: 'Assignments',
    icon: 'person-outline',
    color: Palette.blue500,
    filterKey: 'TICKET_ASSIGNED',
    width: 'half',
  },
  COMMENT_ADDED: {
    label: 'Comments',
    icon: 'chatbubble-outline',
    color: Palette.violet500,
    filterKey: 'COMMENT_ADDED',
    width: 'full',
  },
  COMMENT_MENTION: {
    label: 'Mentions',
    icon: 'at-outline',
    color: Palette.violet500,
    filterKey: 'COMMENT_MENTION',
    width: 'full',
  },
  COMMENT_DELETED: {
    label: 'Comment Deleted',
    icon: 'chatbubble-outline',
    color: Palette.violet500,
    filterKey: 'COMMENT_DELETED',
    width: 'full',
  },
  STATUS_CHANGED: {
    label: 'Status Changed',
    icon: 'swap-horizontal-outline',
    color: Palette.amber500,
    filterKey: 'STATUS_CHANGED',
    width: 'full',
  },
  TICKET_DUE_SOON: {
    label: 'Due Soon',
    icon: 'time-outline',
    color: Palette.amber500,
    filterKey: 'TICKET_DUE_SOON',
    width: 'full',
  },
  TICKET_OVERDUE: {
    label: 'Overdue',
    icon: 'warning-outline',
    color: Palette.zinc500,
    filterKey: 'TICKET_OVERDUE',
    width: 'full',
  },
  PRIORITY_ESCALATED: {
    label: 'Priority Escalated',
    icon: 'trending-up-outline',
    color: Palette.zinc500,
    filterKey: 'PRIORITY_ESCALATED',
    width: 'full',
  },
  EPIC_FEATURE_STATUS_CHANGED: {
    label: 'Epic/Feature Updated',
    icon: 'git-branch-outline',
    color: Palette.amber500,
    filterKey: 'EPIC_FEATURE_STATUS_CHANGED',
    width: 'full',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ALL_ACTIVITIES_CONFIG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The "All Activities" filter chip entry — shown first in the filter row.
 */
export const ALL_ACTIVITIES_CONFIG: ActivityTypeConfig = {
  label: 'All Activities',
  icon: 'list-outline',
  color: Palette.blue500,
  filterKey: 'ALL',
  width: 'full',
};
