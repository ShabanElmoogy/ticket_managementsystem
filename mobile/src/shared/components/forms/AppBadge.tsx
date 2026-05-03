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
 * ✅ MODAL SAFE — no hooks. Colors resolved from static token maps.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { StatusColors, PriorityColors, FontWeight, Radius, FontSize, Palette } from '@/src/constants/tokens';

// Re-export color maps so callers can resolve colors without importing tokens directly
export const STATUS_COLORS: Record<string, string>   = { ...StatusColors };
export const PRIORITY_COLORS: Record<string, string> = { ...PriorityColors };

export type AppBadgeVariant = 'status' | 'priority' | 'role' | 'custom';

export interface AppBadgeProps {
  /** The text shown inside the badge. Underscores are replaced with spaces. */
  label:       string;
  /** Controls automatic color resolution. Default: 'custom' (requires `color` prop). */
  variant?:    AppBadgeVariant;
  /** Explicit accent color — overrides variant auto-resolution. */
  color?:      string;
  /** Container style override. */
  style?:      ViewStyle;
  /** Text style override. */
  labelStyle?: TextStyle;
  /** 'small' (default) = compact inline chip. 'medium' = slightly larger. */
  size?:       'small' | 'medium';
  /** Dims the badge to 45% opacity. */
  disabled?:   boolean;
}

const FALLBACK = Palette.gray400;

const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  variant  = 'custom',
  color,
  style,
  labelStyle,
  size     = 'small',
  disabled = false,
}) => {
  const accent =
    color ??
    (variant === 'status'   ? (StatusColors[label]   ?? FALLBACK) :
     variant === 'priority' ? (PriorityColors[label] ?? FALLBACK) :
     FALLBACK);

  const isSmall  = size === 'small';
  const fontSize = isSmall ? FontSize.xs : FontSize.sm;

  return (
    <View
      style={[
        styles.base,
        {
          paddingHorizontal: isSmall ? 8  : 12,
          paddingVertical:   isSmall ? 2  : 4,
          backgroundColor:   `${accent}22`,
          borderColor:       `${accent}66`,
          opacity:           disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      <Text style={[{ fontWeight: FontWeight.bold, fontSize, color: accent }, labelStyle]}>
        {label.replace(/_/g, ' ')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignSelf:    'flex-start',
    borderWidth:  1,
  },
});

export default AppBadge;
