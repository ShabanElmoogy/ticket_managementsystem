/**
 * ActivityTypeFilter — Collapsible "Filter by Activity Type" row.
 *
 * 9 filter chips:
 *   📋 All Activities (full width)
 *   👤 Assignments (half width)
 *   🎫 New Tickets (half width)
 *   💬 Comments (full width)
 *   @  Mentions (full width)
 *   🗨️ Comment Deleted (full width)
 *   ✏️ Updated Tickets (full width)
 *   🗑️ Deleted Tickets (full width)
 *   ♻️ Restored Tickets (full width)
 *
 * Each chip shows a count badge when count > 0.
 * Active chip: 2px primary-color border + tinted background.
 * Inactive chip: type-specific tinted background.
 *
 * ✅ Uses `c.*` tokens from `useThemeColors()` — screen only (not Modal-safe).
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native') as any;
const Animated = RN.Animated as any;
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import type { ActivityTypeFilter } from '@/src/features/dashboard/hooks/useActivityFeed';

// ─────────────────────────────────────────────────────────────────────────────
// Chip definitions
// ─────────────────────────────────────────────────────────────────────────────

interface ChipDef {
  filterKey: ActivityTypeFilter;
  label:     string;
  icon:      string;
  color:     string;
  width:     'full' | 'half';
}

const CHIP_DEFS: ChipDef[] = [
  {
    filterKey: 'ALL',
    label:     'All Activities',
    icon:      'list-outline',
    color:     Palette.blue500,
    width:     'full',
  },
  {
    filterKey: 'TICKET_ASSIGNED',
    label:     'Assignments',
    icon:      'person-outline',
    color:     Palette.blue500,
    width:     'half',
  },
  {
    filterKey: 'TICKET_CREATED',
    label:     'New Tickets',
    icon:      'ticket-outline',
    color:     Palette.emerald500,
    width:     'half',
  },
  {
    filterKey: 'COMMENT_ADDED',
    label:     'Comments',
    icon:      'chatbubble-outline',
    color:     Palette.violet500,
    width:     'full',
  },
  {
    filterKey: 'COMMENT_MENTION',
    label:     'Mentions',
    icon:      'at-outline',
    color:     Palette.violet500,
    width:     'full',
  },
  {
    filterKey: 'COMMENT_DELETED',
    label:     'Comment Deleted',
    icon:      'chatbubble-outline',
    color:     Palette.violet500,
    width:     'full',
  },
  {
    filterKey: 'TICKET_UPDATED',
    label:     'Updated Tickets',
    icon:      'refresh-outline',
    color:     Palette.amber500,
    width:     'full',
  },
  {
    filterKey: 'TICKET_DELETED' as ActivityTypeFilter,
    label:     'Deleted Tickets',
    icon:      'trash-outline',
    color:     Palette.red500,
    width:     'full',
  },
  {
    filterKey: 'TICKET_RESTORED' as ActivityTypeFilter,
    label:     'Restored Tickets',
    icon:      'refresh-circle-outline',
    color:     Palette.emerald500,
    width:     'full',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ActivityTypeFilterProps {
  activeFilter:   ActivityTypeFilter;
  typeCounts:     Record<string, number>;
  isExpanded:     boolean;
  onFilterChange: (filter: ActivityTypeFilter) => void;
  onToggleExpand: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ActivityTypeFilter: React.FC<ActivityTypeFilterProps> = ({
  activeFilter,
  typeCounts,
  isExpanded,
  onFilterChange,
  onToggleExpand,
}) => {
  const c = useThemeColors();

  // Chevron rotation
  const chevronRotation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  React.useEffect(() => {
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

  // Total count for "All" chip
  const totalCount = Object.values(typeCounts).reduce((sum, n) => sum + n, 0);

  const getCount = (filterKey: ActivityTypeFilter): number => {
    if (filterKey === 'ALL') return totalCount;
    return typeCounts[filterKey] ?? 0;
  };

  return (
    <View style={[styles.container, { borderColor: c.border.primary }]}>
      {/* Toggle row */}
      <Pressable
        onPress={onToggleExpand}
        style={[styles.toggleRow, { backgroundColor: c.surface.secondary }]}
        accessibilityRole="button"
        accessibilityLabel="Toggle activity type filter"
      >
        <Ionicons name="filter-outline" size={14} color={c.text.secondary} />
        <Text style={[styles.toggleLabel, { color: c.text.secondary }]}>
          Filter by Activity Type
        </Text>
        <Animated.View style={{ transform: [{ rotate: chevronAngle }] }}>
          <Ionicons name="chevron-down-outline" size={14} color={c.text.muted} />
        </Animated.View>
      </Pressable>

      {/* Chips grid (when expanded) */}
      {isExpanded && (
        <View style={styles.chipsGrid}>
          {CHIP_DEFS.map((chip) => {
            const isActive = activeFilter === chip.filterKey;
            const count    = getCount(chip.filterKey);

            return (
              <Pressable
                key={chip.filterKey}
                onPress={() => onFilterChange(chip.filterKey)}
                style={[
                  styles.chip,
                  chip.width === 'half' ? styles.halfChip : styles.fullChip,
                  {
                    backgroundColor: isActive
                      ? chip.color + '22'
                      : chip.color + '10',
                    borderColor: isActive
                      ? chip.color
                      : chip.color + '33',
                    borderWidth: isActive ? 2 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${chip.label}`}
              >
                <Ionicons
                  name={chip.icon as any}
                  size={13}
                  color={isActive ? chip.color : chip.color + 'aa'}
                />
                <Text style={[
                  styles.chipLabel,
                  { color: isActive ? chip.color : c.text.secondary },
                ]}>
                  {chip.label}
                </Text>

                {/* Count badge */}
                {count > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: chip.color }]}>
                    <Text style={styles.countText}>
                      {count > 99 ? '99+' : count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
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
    borderTopWidth: 1,
    overflow:       'hidden',
  },
  toggleRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  toggleLabel: {
    flex:       1,
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  chipsGrid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    gap:               Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:      Radius.full,
  },
  fullChip: {
    // Takes full row width minus padding
    flexBasis: '100%',
  },
  halfChip: {
    // Takes roughly half the row
    flexBasis: '47%',
    flexGrow:  1,
  },
  chipLabel: {
    flex:       1,
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  countBadge: {
    minWidth:          16,
    height:            16,
    borderRadius:      8,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
  },
  countText: {
    fontSize:   8,
    fontWeight: FontWeight.bold,
    color:      Palette.white,
  },
});

export default ActivityTypeFilter;
