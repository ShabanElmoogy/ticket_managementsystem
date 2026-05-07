/**
 * TicketFeedFilter — Filter bar for the Dashboard ticket feed.
 *
 * Header row: "📋 Ticket Feed" title + view toggle (Feed/Grid/Compact) + Refresh button.
 *
 * Filter controls:
 *   - AppTextInput (search) with 400ms debounce (handled by useDashboard)
 *   - Status selector (All / Open / In Progress / Resolved / Closed)
 *   - Priority selector (All / Low / Medium / High / Urgent)
 *   - User selector (TENANT_ADMIN only) — with ticket-count badges
 *   - Customer selector (TENANT_ADMIN only)
 *   - Application selector (TENANT_ADMIN only)
 *   - Overdue toggle button
 *   - Deleted toggle (TENANT_ADMIN only)
 *
 * When no filters active: quick status chips row.
 * When filters active: results summary bar with "Clear all" button.
 *
 * ✅ Uses `c.*` tokens from `useThemeColors()` — screen only (not Modal-safe).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import AppTextInput from '@/src/shared/components/forms/AppTextInput';
import type { ViewMode, DashboardFilters } from '@/src/features/dashboard/hooks/useDashboard';
import type { User } from '@/src/services/api/types/user';
import type { Customer } from '@/src/services/api/types/customer';
import type { Application } from '@/src/services/api/types/application';

// ─────────────────────────────────────────────────────────────────────────────
// Status / Priority options
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '',            label: 'All Statuses',  color: undefined },
  { value: 'OPEN',        label: 'Open',          color: Palette.amber500 },
  { value: 'IN_PROGRESS', label: 'In Progress',   color: Palette.violet500 },
  { value: 'PROGRAMMING', label: 'Programming',   color: Palette.indigo500 },
  { value: 'RESOLVED',    label: 'Resolved',      color: Palette.emerald500 },
  { value: 'CLOSED',      label: 'Closed',        color: Palette.zinc500 },
];

const PRIORITY_OPTIONS = [
  { value: '',       label: 'All Priorities', color: undefined },
  { value: 'LOW',    label: 'Low',            color: Palette.emerald500 },
  { value: 'MEDIUM', label: 'Medium',         color: Palette.amber500 },
  { value: 'HIGH',   label: 'High',           color: Palette.orange500 },
  { value: 'URGENT', label: 'Urgent',         color: Palette.red500 },
];

const QUICK_STATUS_CHIPS = [
  { value: 'OPEN',        label: 'Open',      color: Palette.amber500 },
  { value: 'IN_PROGRESS', label: 'In Progress', color: Palette.violet500 },
  { value: 'RESOLVED',    label: 'Resolved',  color: Palette.emerald500 },
  { value: 'CLOSED',      label: 'Closed',    color: Palette.zinc500 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Simple inline select dropdown
// ─────────────────────────────────────────────────────────────────────────────

interface InlineSelectProps {
  label:    string;
  value:    string;
  options:  { value: string; label: string; color?: string }[];
  onChange: (v: string) => void;
}

const InlineSelect: React.FC<InlineSelectProps> = ({ label, value, options, onChange }) => {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <View style={{ position: 'relative' }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[
          styles.selectTrigger,
          {
            backgroundColor: c.surface.elevated,
            borderColor:     value ? c.interactive.primary : c.border.primary,
            borderWidth:     value ? 1.5 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected.label}`}
      >
        {selected.color && (
          <View style={[styles.colorDot, { backgroundColor: selected.color }]} />
        )}
        <Text style={[styles.selectText, { color: value ? c.interactive.primary : c.text.secondary }]}>
          {selected.label}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={c.text.muted}
        />
      </Pressable>

      {open && (
        <View style={[styles.dropdown, { backgroundColor: c.surface.card, borderColor: c.border.primary }]}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => { onChange(opt.value); setOpen(false); }}
              style={[
                styles.dropdownItem,
                opt.value === value && { backgroundColor: c.interactive.primary + '18' },
              ]}
            >
              {opt.color && (
                <View style={[styles.colorDot, { backgroundColor: opt.color }]} />
              )}
              <Text style={[
                styles.dropdownText,
                { color: opt.value === value ? c.interactive.primary : c.text.primary },
              ]}>
                {opt.label}
              </Text>
              {opt.value === value && (
                <Ionicons name="checkmark" size={14} color={c.interactive.primary} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface TicketFeedFilterProps {
  filters:          DashboardFilters;
  hasActiveFilters: boolean;
  ticketCount:      number;
  viewMode:         ViewMode;
  isAdmin:          boolean;
  isEmployee:       boolean;
  isRefreshing:     boolean;

  // Filter setters
  onSearchChange:        (v: string) => void;
  onStatusChange:        (v: string) => void;
  onPriorityChange:      (v: string) => void;
  onUserChange:          (v: string) => void;
  onCustomerChange:      (v: string) => void;
  onApplicationChange:   (v: string) => void;
  onToggleOverdue:       () => void;
  onToggleDeleted:       () => void;
  onClearFilters:        () => void;
  onViewModeChange:      (mode: ViewMode) => void;
  onRefresh:             () => void;

  // Aux data for selectors
  users?:        User[];
  customers?:    Customer[];
  applications?: Application[];
  /** Ticket counts per user ID for the count badge */
  userTicketCounts?: Record<string, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketFeedFilter: React.FC<TicketFeedFilterProps> = ({
  filters,
  hasActiveFilters,
  ticketCount,
  viewMode,
  isAdmin,
  isEmployee,
  isRefreshing,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onUserChange,
  onCustomerChange,
  onApplicationChange,
  onToggleOverdue,
  onToggleDeleted,
  onClearFilters,
  onViewModeChange,
  onRefresh,
  users = [],
  customers = [],
  applications = [],
  userTicketCounts = {},
}) => {
  const c = useThemeColors();

  // ── User options with count badges ────────────────────────────────────────

  const userOptions = [
    { value: '', label: 'All Users' },
    { value: 'UNASSIGNED', label: 'New Tickets (Unassigned)' },
    ...users.map((u) => ({
      value: u.id,
      label: u.name,
      count: userTicketCounts[u.id] ?? 0,
    })),
  ];

  const customerOptions = [
    { value: '', label: 'All Customers' },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];

  const applicationOptions = [
    { value: '', label: 'All Applications' },
    ...applications.map((a) => ({ value: a.id, label: a.name })),
  ];

  // ── View mode icons ────────────────────────────────────────────────────────

  const VIEW_MODES: { mode: ViewMode; icon: string }[] = [
    { mode: 'feed',    icon: 'list-outline' },
    { mode: 'grid',    icon: 'grid-outline' },
    { mode: 'compact', icon: 'reorder-four-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.surface.primary, borderBottomColor: c.border.primary }]}>

      {/* ── Header row ──────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="ticket-outline" size={16} color={c.interactive.primary} />
          <Text style={[styles.headerTitle, { color: c.text.primary }]}>
            Ticket Feed
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* View mode toggle */}
          <View style={[styles.viewToggle, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}>
            {VIEW_MODES.map(({ mode, icon }) => (
              <Pressable
                key={mode}
                onPress={() => onViewModeChange(mode)}
                style={[
                  styles.viewToggleBtn,
                  viewMode === mode && { backgroundColor: c.interactive.primary },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${mode} view`}
              >
                <Ionicons
                  name={icon as any}
                  size={14}
                  color={viewMode === mode ? c.text.inverse : c.text.muted}
                />
              </Pressable>
            ))}
          </View>

          {/* Refresh button */}
          <Pressable
            onPress={onRefresh}
            style={[styles.refreshBtn, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh"
          >
            <Ionicons
              name="refresh-outline"
              size={16}
              color={isRefreshing ? c.interactive.primary : c.text.secondary}
            />
          </Pressable>
        </View>
      </View>

      {/* ── Search input ────────────────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <AppTextInput
          fieldType="search"
          value={filters.search}
          onChangeText={onSearchChange}
          placeholder="Search tickets, users, customers..."
          showClearButton
          onClear={() => onSearchChange('')}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* ── Filter selectors ────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {/* Status */}
        <InlineSelect
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={onStatusChange}
        />

        {/* Priority */}
        <InlineSelect
          label="Priority"
          value={filters.priority}
          options={PRIORITY_OPTIONS}
          onChange={onPriorityChange}
        />

        {/* User (admin only) */}
        {isAdmin && (
          <InlineSelect
            label="User"
            value={filters.userId}
            options={userOptions}
            onChange={onUserChange}
          />
        )}

        {/* Customer (admin only) */}
        {isAdmin && (
          <InlineSelect
            label="Customer"
            value={filters.customerId}
            options={customerOptions}
            onChange={onCustomerChange}
          />
        )}

        {/* Application (admin only) */}
        {isAdmin && (
          <InlineSelect
            label="Application"
            value={filters.applicationId}
            options={applicationOptions}
            onChange={onApplicationChange}
          />
        )}

        {/* Overdue toggle */}
        <Pressable
          onPress={onToggleOverdue}
          style={[
            styles.toggleBtn,
            {
              backgroundColor: filters.overdue ? Palette.red500 : c.surface.elevated,
              borderColor:     filters.overdue ? Palette.red600 : c.border.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Overdue filter"
        >
          <Ionicons
            name="warning-outline"
            size={13}
            color={filters.overdue ? Palette.white : c.text.secondary}
          />
          <Text style={[
            styles.toggleText,
            { color: filters.overdue ? Palette.white : c.text.secondary },
          ]}>
            Overdue
          </Text>
        </Pressable>

        {/* Deleted toggle (admin only) */}
        {isAdmin && (
          <Pressable
            onPress={onToggleDeleted}
            style={[
              styles.toggleBtn,
              {
                backgroundColor: filters.deleted ? Palette.zinc600 : c.surface.elevated,
                borderColor:     filters.deleted ? Palette.zinc700 : c.border.primary,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Show deleted tickets"
          >
            <Ionicons
              name="trash-outline"
              size={13}
              color={filters.deleted ? Palette.white : c.text.secondary}
            />
            <Text style={[
              styles.toggleText,
              { color: filters.deleted ? Palette.white : c.text.secondary },
            ]}>
              Deleted
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ── Quick chips (no filters) OR results summary (filters active) ────── */}
      {!hasActiveFilters ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsRow}
        >
          {QUICK_STATUS_CHIPS.map((chip) => (
            <Pressable
              key={chip.value}
              onPress={() => onStatusChange(chip.value)}
              style={[
                styles.quickChip,
                {
                  backgroundColor: chip.color + '18',
                  borderColor:     chip.color + '44',
                },
              ]}
              accessibilityRole="button"
            >
              <View style={[styles.chipDot, { backgroundColor: chip.color }]} />
              <Text style={[styles.quickChipText, { color: chip.color }]}>
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.summaryBar, { backgroundColor: c.surface.secondary }]}>
          <Text style={[styles.summaryText, { color: c.text.secondary }]}>
            {ticketCount} ticket{ticketCount !== 1 ? 's' : ''} found
          </Text>
          <Pressable
            onPress={onClearFilters}
            style={[styles.clearBtn, { backgroundColor: c.interactive.primary + '18' }]}
            accessibilityRole="button"
          >
            <Ionicons name="close-outline" size={14} color={c.interactive.primary} />
            <Text style={[styles.clearBtnText, { color: c.interactive.primary }]}>
              Clear all
            </Text>
          </Pressable>
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
    borderBottomWidth: 1,
    paddingBottom:     Spacing.sm,
  },
  headerRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  headerTitle: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius:  Radius.lg,
    borderWidth:   1,
    overflow:      'hidden',
  },
  viewToggleBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
  },
  refreshBtn: {
    width:          32,
    height:         32,
    borderRadius:   Radius.lg,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  searchRow: {
    paddingHorizontal: Spacing.md,
    marginBottom:      -Spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  filtersRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    gap:               Spacing.sm,
    alignItems:        'center',
  },
  // InlineSelect
  selectTrigger: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
    borderWidth:       1,
  },
  selectText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  colorDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  dropdown: {
    position:     'absolute',
    top:          '100%',
    left:         0,
    minWidth:     160,
    borderRadius: Radius.xl,
    borderWidth:  1,
    zIndex:       100,
    shadowColor:  'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation:    8,
    marginTop:    Spacing.xs,
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
  // Toggle buttons
  toggleBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
    borderWidth:       1,
  },
  toggleText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  // Quick chips
  quickChipsRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs,
    gap:               Spacing.sm,
  },
  quickChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs,
    borderRadius:      Radius.full,
    borderWidth:       1,
  },
  chipDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  quickChipText: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  // Summary bar
  summaryBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    marginHorizontal:  Spacing.md,
    borderRadius:      Radius.xl,
  },
  summaryText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  clearBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:      Radius.full,
  },
  clearBtnText: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});

export default TicketFeedFilter;
