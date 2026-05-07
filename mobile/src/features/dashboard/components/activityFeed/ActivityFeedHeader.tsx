/**
 * ActivityFeedHeader — Header for the collapsible Activity Feed panel.
 *
 * Layout (left → right):
 *   🔔 Bell icon with pulsing count badge
 *   "Activity Feed" title (bold)
 *   "{N} new activities" subtitle (primary color, only when unread > 0)
 *   ✓✓ Mark All Read icon button
 *   ○  Mark All Unread icon button
 *   ×  Clear All icon button
 *   ∧/∨ Collapse toggle chevron
 *
 * Rainbow gradient line at the top edge when expanded.
 *
 * ✅ Uses `c.*` tokens from `useThemeColors()` — screen only (not Modal-safe).
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native') as any;
const Animated = RN.Animated as any;
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Rainbow gradient line (simulated with View segments)
// ─────────────────────────────────────────────────────────────────────────────

const RAINBOW_COLORS = [
  Palette.blue500,
  Palette.violet500,
  Palette.emerald500,
  Palette.amber500,
];

const RainbowLine: React.FC = () => (
  <View style={styles.rainbowLine}>
    {RAINBOW_COLORS.map((color, i) => (
      <View
        key={i}
        style={[styles.rainbowSegment, { backgroundColor: color }]}
      />
    ))}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Pulsing bell badge
// ─────────────────────────────────────────────────────────────────────────────

const PulsingBadge: React.FC<{ count: number; color: string }> = ({ count, color }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (count === 0) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [count, scale]);

  if (count === 0) return null;

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: color, transform: [{ scale }] },
      ]}
    >
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Icon action button
// ─────────────────────────────────────────────────────────────────────────────

interface ActionBtnProps {
  icon:    string;
  color:   string;
  onPress: () => void;
  label:   string;
}

const ActionBtn: React.FC<ActionBtnProps> = ({ icon, color, onPress, label }) => {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.actionBtn,
        { backgroundColor: pressed ? color + '22' : 'transparent' },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon as any} size={18} color={color} />
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ActivityFeedHeaderProps {
  unreadCount:    number;
  isExpanded:     boolean;
  onMarkAllRead:  () => void;
  onMarkAllUnread:() => void;
  onClearAll:     () => void;
  onToggleExpand: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ActivityFeedHeader: React.FC<ActivityFeedHeaderProps> = ({
  unreadCount,
  isExpanded,
  onMarkAllRead,
  onMarkAllUnread,
  onClearAll,
  onToggleExpand,
}) => {
  const c = useThemeColors();

  // Chevron rotation animation
  const chevronRotation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(chevronRotation, {
      toValue:         isExpanded ? 1 : 0,
      duration:        200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, chevronRotation]);

  const chevronAngle = chevronRotation.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: c.surface.card, borderColor: c.border.primary }]}>
      {/* Rainbow gradient line at top edge (when expanded) */}
      {isExpanded && <RainbowLine />}

      {/* Main header row */}
      <View style={styles.headerRow}>
        {/* Bell + badge */}
        <View style={styles.bellContainer}>
          <Ionicons name="notifications-outline" size={22} color={c.interactive.primary} />
          <PulsingBadge count={unreadCount} color={c.intent.error} />
        </View>

        {/* Title + subtitle */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: c.text.primary }]}>
            Activity Feed
          </Text>
          {unreadCount > 0 && (
            <Text style={[styles.subtitle, { color: c.interactive.primary }]}>
              {unreadCount} new {unreadCount === 1 ? 'activity' : 'activities'}
            </Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <ActionBtn
            icon="checkmark-done-outline"
            color={c.intent.success}
            onPress={onMarkAllRead}
            label="Mark all read"
          />
          <ActionBtn
            icon="radio-button-off-outline"
            color={c.intent.warning}
            onPress={onMarkAllUnread}
            label="Mark all unread"
          />
          <ActionBtn
            icon="close-outline"
            color={c.intent.error}
            onPress={onClearAll}
            label="Clear all"
          />

          {/* Collapse toggle */}
          <Pressable
            onPress={onToggleExpand}
            style={({ pressed }: { pressed: boolean }) => [
              styles.actionBtn,
              { backgroundColor: pressed ? c.surface.elevated : 'transparent' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? 'Collapse activity feed' : 'Expand activity feed'}
          >
            <Animated.View style={{ transform: [{ rotate: chevronAngle }] }}>
              <Ionicons name="chevron-down-outline" size={18} color={c.text.secondary} />
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderWidth:  1,
    borderRadius: Radius.xl,
    overflow:     'hidden',
  },
  rainbowLine: {
    flexDirection: 'row',
    height:        3,
  },
  rainbowSegment: {
    flex: 1,
  },
  headerRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    gap:               Spacing.sm,
  },
  bellContainer: {
    position: 'relative',
    width:    28,
    height:   28,
    alignItems:     'center',
    justifyContent: 'center',
  },
  badge: {
    position:          'absolute',
    top:               -4,
    right:             -6,
    minWidth:          16,
    height:            16,
    borderRadius:      8,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize:   9,
    fontWeight: FontWeight.bold,
    color:      Palette.white,
  },
  titleSection: {
    flex: 1,
    gap:  2,
  },
  title: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  actions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
  },
  actionBtn: {
    width:          32,
    height:         32,
    borderRadius:   Radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default ActivityFeedHeader;
