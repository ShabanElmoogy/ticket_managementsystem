/**
 * BulkActionBar — Appears when tickets are selected (admin only).
 *
 * Shows: selected count + status selector + Apply button + Deselect All.
 * Calls `ticketsApi.bulkUpdate` via the `onApply` callback.
 *
 * ✅ Uses `c.*` tokens from `useThemeColors()` — screen only (not Modal-safe).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import type { TicketStatus } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Status options
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'OPEN',             label: 'Open',             color: Palette.amber500 },
  { value: 'IN_PROGRESS',      label: 'In Progress',      color: Palette.violet500 },
  { value: 'PROGRAMMING',      label: 'Programming',      color: Palette.indigo500 },
  { value: 'UNDER_DEVELOPMENT',label: 'Under Development',color: Palette.blue500 },
  { value: 'CODE_REVIEW',      label: 'Code Review',      color: Palette.cyan500 },
  { value: 'TESTING',          label: 'Testing',          color: Palette.teal500 },
  { value: 'RESOLVED',         label: 'Resolved',         color: Palette.emerald500 },
  { value: 'CLOSED',           label: 'Closed',           color: Palette.zinc500 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface BulkActionBarProps {
  selectedCount:   number;
  isApplying:      boolean;
  onApply:         (status: TicketStatus) => Promise<void>;
  onDeselectAll:   () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  isApplying,
  onApply,
  onDeselectAll,
}) => {
  const c = useThemeColors();
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('');
  const [dropdownOpen,   setDropdownOpen]   = useState(false);

  const selectedOption = STATUS_OPTIONS.find((o) => o.value === selectedStatus);

  const handleApply = async () => {
    if (!selectedStatus) return;
    await onApply(selectedStatus as TicketStatus);
    setSelectedStatus('');
  };

  if (selectedCount === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: c.interactive.primary, shadowColor: c.shadow }]}>
      {/* Left: count badge + deselect */}
      <View style={styles.leftSection}>
        <View style={[styles.countBadge, { backgroundColor: Palette.white + '30' }]}>
          <Text style={[styles.countText, { color: Palette.white }]}>
            {selectedCount}
          </Text>
        </View>
        <Text style={[styles.selectedLabel, { color: Palette.white }]}>
          selected
        </Text>
        <Pressable
          onPress={onDeselectAll}
          style={styles.deselectBtn}
          accessibilityRole="button"
          accessibilityLabel="Deselect all"
        >
          <Ionicons name="close-outline" size={16} color={Palette.white + 'cc'} />
        </Pressable>
      </View>

      {/* Center: status selector */}
      <View style={styles.centerSection}>
        <Pressable
          onPress={() => setDropdownOpen((v) => !v)}
          style={[styles.statusSelector, { backgroundColor: Palette.white + '20', borderColor: Palette.white + '40' }]}
          accessibilityRole="button"
          accessibilityLabel="Select status"
        >
          {selectedOption && (
            <View style={[styles.statusDot, { backgroundColor: selectedOption.color }]} />
          )}
          <Text style={[styles.statusSelectorText, { color: Palette.white }]}>
            {selectedOption ? selectedOption.label : 'Set Status...'}
          </Text>
          <Ionicons
            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={Palette.white + 'cc'}
          />
        </Pressable>

        {/* Dropdown */}
        {dropdownOpen && (
          <View style={[styles.dropdown, { backgroundColor: c.surface.card, borderColor: c.border.primary }]}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { setSelectedStatus(opt.value); setDropdownOpen(false); }}
                style={[
                  styles.dropdownItem,
                  opt.value === selectedStatus && { backgroundColor: c.interactive.primary + '18' },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
                <Text style={[
                  styles.dropdownText,
                  { color: opt.value === selectedStatus ? c.interactive.primary : c.text.primary },
                ]}>
                  {opt.label}
                </Text>
                {opt.value === selectedStatus && (
                  <Ionicons name="checkmark" size={14} color={c.interactive.primary} />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Right: Apply button */}
      <Pressable
        onPress={handleApply}
        disabled={!selectedStatus || isApplying}
        style={({ pressed }: { pressed: boolean }) => [
          styles.applyBtn,
          {
            backgroundColor: !selectedStatus || isApplying
              ? Palette.white + '30'
              : pressed
              ? Palette.white + 'dd'
              : Palette.white,
            opacity: !selectedStatus ? 0.5 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Apply bulk status"
      >
        {isApplying ? (
          <ActivityIndicator size="small" color={c.interactive.primary} />
        ) : (
          <>
            <Ionicons name="checkmark-outline" size={14} color={c.interactive.primary} />
            <Text style={[styles.applyText, { color: c.interactive.primary }]}>
              Apply
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    gap:               Spacing.sm,
    shadowOffset:      { width: 0, height: -2 },
    shadowOpacity:     1,
    shadowRadius:      8,
    elevation:         8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
  },
  countBadge: {
    minWidth:          24,
    height:            24,
    borderRadius:      12,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Spacing.xs,
  },
  countText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  selectedLabel: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  deselectBtn: {
    padding: Spacing.xs,
  },
  centerSection: {
    flex:     1,
    position: 'relative',
  },
  statusSelector: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:      Radius.full,
    borderWidth:       1,
  },
  statusSelectorText: {
    flex:       1,
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  statusDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  dropdown: {
    position:      'absolute',
    bottom:        '100%',
    left:          0,
    right:         0,
    borderRadius:  Radius.xl,
    borderWidth:   1,
    zIndex:        100,
    shadowColor:   'rgba(0,0,0,0.15)',
    shadowOffset:  { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius:  8,
    elevation:     8,
    marginBottom:  Spacing.xs,
  },
  dropdownItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
  },
  dropdownText: {
    flex:       1,
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  applyBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
  },
  applyText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});

export default BulkActionBar;
