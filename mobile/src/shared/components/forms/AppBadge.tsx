/**
 * AppBadge — colored pill badge for status, priority, role, or custom labels.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. TicketsScreen (admin/tickets/TicketsScreen.tsx)
 *    - Status column:   <AppBadge label={row.status}   variant="status"   />
 *    - Priority column: <AppBadge label={row.priority} variant="priority" />
 *
 * 2. TenantsScreen (admin/tenants/TenantsScreen.tsx)
 *    - Subscription status: <AppBadge label={row.subscriptionStatus} color={STATUS_COLOR[...]} />
 *
 * 3. TemplatesScreen (admin/templates/TemplatesScreen.tsx)
 *    - Priority column: <AppBadge label={row.priority} variant="priority" />
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * VARIANTS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 'status'   — auto-resolves color from StatusColors map (OPEN, IN_PROGRESS, etc.)
 * 'priority' — auto-resolves color from PriorityColors map (LOW, MEDIUM, HIGH, URGENT)
 * 'role'     — reserved for future role badges (SUPER_ADMIN, TENANT_ADMIN, etc.)
 * 'custom'   — pass explicit `color` prop
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * // Status badge — color resolved automatically
 * <AppBadge label="OPEN" variant="status" />
 * <AppBadge label="IN_PROGRESS" variant="status" />
 *
 * // Priority badge
 * <AppBadge label="HIGH" variant="priority" />
 * <AppBadge label="URGENT" variant="priority" size="medium" />
 *
 * // Custom color
 * <AppBadge label="ACTIVE" color="#10b981" />
 * <AppBadge label="EXPIRED" color="#ef4444" size="medium" />
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * This component calls useThemeColors() internally.
 * Do NOT use inside a <Modal> — pass resolved colors via the `color` prop instead.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { StatusColors, PriorityColors, useThemeColors, FontWeight, Radius, FontSize } from '@/src/constants/theme';

// Re-export color maps so callers can resolve colors without importing tokens directly
export const STATUS_COLORS: Record<string, string>   = { ...StatusColors };
export const PRIORITY_COLORS: Record<string, string> = { ...PriorityColors };

export type AppBadgeVariant = 'status' | 'priority' | 'role' | 'custom';

export interface AppBadgeProps {
  /** The text shown inside the badge. Underscores are replaced with spaces. */
  label:    string;
  /** Controls automatic color resolution. Default: 'custom' (requires `color` prop). */
  variant?: AppBadgeVariant;
  /** Explicit accent color — overrides variant auto-resolution. */
  color?:   string;
  /** Container style override. */
  style?:   ViewStyle;
  /** 'small' (default) = compact inline chip. 'medium' = slightly larger. */
  size?:    'small' | 'medium';
}

const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  variant = 'custom',
  color,
  style,
  size = 'small',
}) => {
  const c = useThemeColors();

  // Resolve accent color: explicit prop → variant map → fallback muted
  const accent =
    color ??
    (variant === 'status'   ? (StatusColors[label]   ?? c.text.muted) :
     variant === 'priority' ? (PriorityColors[label] ?? c.text.muted) :
     c.text.muted);

  const padding  = size === 'small'
    ? { paddingHorizontal: 8,  paddingVertical: 2 }
    : { paddingHorizontal: 12, paddingVertical: 4 };

  const fontSize = size === 'small' ? FontSize.xs : FontSize.sm;

  return (
    <View
      style={[
        {
          borderRadius:    Radius.full,
          alignSelf:       'flex-start',
          borderWidth:     1,
          backgroundColor: `${accent}22`,  // 13% opacity fill
          borderColor:     `${accent}66`,  // 40% opacity border
          ...padding,
        },
        style,
      ]}
    >
      <Text style={{ fontWeight: FontWeight.bold, fontSize, color: accent }}>
        {label.replace(/_/g, ' ')}
      </Text>
    </View>
  );
};

export default AppBadge;
