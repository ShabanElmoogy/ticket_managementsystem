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
    icon: 'add-circle-outline',
    color: Palette.emerald500,
    filterKey: 'TICKET_CREATED',
    width: 'half',
  },
  TICKET_UPDATED: {
    label: 'Updates',
    icon: 'pencil-outline',
    color: Palette.amber500,
    filterKey: 'TICKET_UPDATED',
    width: 'full',
  },
  TICKET_ASSIGNED: {
    label: 'Assignments',
    icon: 'person-add-outline',
    color: Palette.blue500,
    filterKey: 'TICKET_ASSIGNED',
    width: 'half',
  },
  TICKET_REASSIGNED: {
    label: 'Reassignments',
    icon: 'people-outline',
    color: Palette.indigo500,
    filterKey: 'TICKET_REASSIGNED',
    width: 'half',
  },
  COMMENT_ADDED: {
    label: 'Comments',
    icon: 'chatbubble-ellipses-outline',
    color: Palette.violet500,
    filterKey: 'COMMENT_ADDED',
    width: 'full',
  },
  COMMENT_MENTION: {
    label: 'Mentions',
    icon: 'at-circle-outline',
    color: Palette.fuchsia500,
    filterKey: 'COMMENT_MENTION',
    width: 'full',
  },
  COMMENT_DELETED: {
    label: 'Comment Deleted',
    icon: 'chatbubble-outline',
    color: Palette.rose400,
    filterKey: 'COMMENT_DELETED',
    width: 'full',
  },
  STATUS_CHANGED: {
    label: 'Status Changed',
    icon: 'sync-outline',
    color: Palette.sky500,
    filterKey: 'STATUS_CHANGED',
    width: 'full',
  },
  TICKET_DUE_SOON: {
    label: 'Due Soon',
    icon: 'timer-outline',
    color: Palette.orange500,
    filterKey: 'TICKET_DUE_SOON',
    width: 'full',
  },
  TICKET_OVERDUE: {
    label: 'Overdue',
    icon: 'alert-circle-outline',
    color: Palette.red600,
    filterKey: 'TICKET_OVERDUE',
    width: 'full',
  },
  PRIORITY_ESCALATED: {
    label: 'Escalated',
    icon: 'trending-up-outline',
    color: Palette.rose600,
    filterKey: 'PRIORITY_ESCALATED',
    width: 'full',
  },
  EPIC_FEATURE_STATUS_CHANGED: {
    label: 'Epic/Feature',
    icon: 'layers-outline',
    color: Palette.indigo600,
    filterKey: 'EPIC_FEATURE_STATUS_CHANGED',
    width: 'full',
  },
  TICKET_DELETED: {
    label: 'Deleted',
    icon: 'trash-outline',
    color: Palette.zinc500,
    filterKey: 'TICKET_DELETED',
    width: 'half',
  },
  TICKET_RESTORED: {
    label: 'Restored',
    icon: 'refresh-circle-outline',
    color: Palette.lime500,
    filterKey: 'TICKET_RESTORED',
    width: 'half',
  },
  WATCH_STARTED: {
    label: 'Watching',
    icon: 'eye-outline',
    color: Palette.teal500,
    filterKey: 'WATCH_STARTED',
    width: 'half',
  },
  WATCH_STOPPED: {
    label: 'Unwatched',
    icon: 'eye-off-outline',
    color: Palette.slate400,
    filterKey: 'WATCH_STOPPED',
    width: 'half',
  },
  ATTACHMENT_ADDED: {
    label: 'Attachments',
    icon: 'attach-outline',
    color: Palette.cyan500,
    filterKey: 'ATTACHMENT_ADDED',
    width: 'full',
  },
  ATTACHMENT_DELETED: {
    label: 'Attachment Removed',
    icon: 'document-outline',
    color: Palette.rose500,
    filterKey: 'ATTACHMENT_DELETED',
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

/**
 * Robustly retrieves the configuration for an activity action string.
 * Handles normalization and keyword matching.
 */
/**
 * Returns a semi-random but stable config based on a string (ID or description).
 * Used when no specific activity match is found to ensure visual variety.
 */
const getFallbackConfig = (seed: string): ActivityTypeConfig => {
  const colors = [
    Palette.blue500, Palette.emerald500, Palette.violet500, 
    Palette.amber500, Palette.rose500, Palette.sky500, 
    Palette.indigo500, Palette.teal500
  ];
  const icons = [
    'radio-button-on-outline', 'disc-outline', 'ellipse-outline', 
    'aperture-outline', 'bookmark-outline', 'flash-outline', 
    'prism-outline', 'rocket-outline'
  ];
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  
  return {
    label: 'Activity',
    icon: icons[index],
    color: colors[index],
    filterKey: 'UNKNOWN',
    width: 'full',
  };
};

export const getActivityConfig = (action: string, description?: string, id?: string): ActivityTypeConfig => {
  const act = (action || '').toUpperCase();
  const desc = (description || '').toUpperCase();
  const combined = `${act} ${desc}`.replace(/\s+/g, '_');
  
  // 1. Direct match on normalized action
  const normalizedAct = act.replace(/\s+/g, '_');
  if (ACTIVITY_TYPE_CONFIG[normalizedAct]) return ACTIVITY_TYPE_CONFIG[normalizedAct];
  
  // 2. Keyword matches on combined string
  if (combined.includes('CREATE'))   return ACTIVITY_TYPE_CONFIG.TICKET_CREATED;
  if (combined.includes('ASSIGN'))   return ACTIVITY_TYPE_CONFIG.TICKET_ASSIGNED;
  if (combined.includes('STATUS'))   return ACTIVITY_TYPE_CONFIG.STATUS_CHANGED;
  if (combined.includes('COMMENT'))  return ACTIVITY_TYPE_CONFIG.COMMENT_ADDED;
  if (combined.includes('DELETE'))   return ACTIVITY_TYPE_CONFIG.TICKET_DELETED;
  if (combined.includes('RESTORE'))  return ACTIVITY_TYPE_CONFIG.TICKET_RESTORED;
  if (combined.includes('ATTACH'))   return ACTIVITY_TYPE_CONFIG.ATTACHMENT_ADDED;
  if (combined.includes('DUE'))      return ACTIVITY_TYPE_CONFIG.TICKET_DUE_SOON;
  if (combined.includes('PRIORITY')) return ACTIVITY_TYPE_CONFIG.PRIORITY_ESCALATED;
  if (combined.includes('WATCH'))    return ACTIVITY_TYPE_CONFIG.WATCH_STARTED;
  if (combined.includes('MENTION'))  return ACTIVITY_TYPE_CONFIG.COMMENT_MENTION;
  
  if (combined.includes('EPIC') || combined.includes('FEATURE')) {
    return ACTIVITY_TYPE_CONFIG.EPIC_FEATURE_STATUS_CHANGED;
  }
  
  // 3. Fallback based on common verbs in description
  if (desc.includes('ADDED'))    return ACTIVITY_TYPE_CONFIG.TICKET_CREATED;
  if (desc.includes('CHANGED'))  return ACTIVITY_TYPE_CONFIG.TICKET_UPDATED;
  if (desc.includes('REMOVED'))  return ACTIVITY_TYPE_CONFIG.TICKET_DELETED;
  
  // 4. Final safety: use a hash-based fallback to ensure visual variety if it's truly generic
  return getFallbackConfig(id || combined);
};
