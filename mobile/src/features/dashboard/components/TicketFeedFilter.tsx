/**
 * TicketFeedFilter — Simplified filter bar for the Dashboard ticket feed.
 *
 * Header row: "Ticket Feed" title + view toggle + Refresh button.
 *
 * Filter bar:
 *   - Search input (always visible)
 *   - "Filters" button — opens a bottom sheet modal with ALL filter controls
 *   - Active filter count badge on the Filters button
 *
 * Filter modal contains:
 *   - Status selector
 *   - Priority selector
 *   - User selector (admin only)
 *   - Customer selector (admin only)
 *   - Application selector (admin only)
 *   - Overdue toggle
 *   - Deleted toggle (admin only)
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
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import AppTextInput from '@/src/shared/components/forms/AppTextInput';
import type { ViewMode, DashboardFilters } from '@/src/features/dashboard/hooks/useDashboard';
import type { User } from '@/src/services/api/types/user';
import type { Customer } from '@/src/services/api/types/customer';
import type { Application } from '@/src/services/api/types/application';

// ─────────────────────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '',                  label: 'All Statuses',  color: undefined },
  { value: 'OPEN',              label: 'Open',          color: Palette.amber500 },
  { value: 'IN_PROGRESS',       label: 'In Progress',   color: Palette.violet500 },
  { value: 'PROGRAMMING',       label: 'Programming',   color: Palette.indigo500 },
  { value: 'UNDER_DEVELOPMENT', label: 'Under Dev',     color: Palette.blue500 },
  { value: 'CODE_REVIEW',       label: 'Code Review',   color: Palette.purple500 },
  { value: 'TESTING',           label: 'Testing',       color: Palette.cyan500 },
  { value: 'RESOLVED',          label: 'Resolved',      color: Palette.emerald500 },
  { value: 'CLOSED',            label: 'Closed',        color: Palette.zinc500 },
];

const PRIORITY_OPTIONS = [
  { value: '',       label: 'All Priorities', color: undefined },
  { value: 'LOW',    label: 'Low',            color: Palette.emerald500 },
  { value: 'MEDIUM', label: 'Medium',         color: Palette.amber500 },
  { value: 'HIGH',   label: 'High',           color: Palette.orange500 },
  { value: 'URGENT', label: 'Urgent',         color: Palette.red500 },
];

const QUICK_STATUS_CHIPS = [
  { value: 'OPEN',        label: 'Open',       color: Palette.amber500 },
  { value: 'IN_PROGRESS', label: 'In Progress', color: Palette.violet500 },
  { value: 'RESOLVED',    label: 'Resolved',   color: Palette.emerald500 },
  { value: 'CLOSED',      label: 'Closed',     color: Palette.zinc500 },
];

// ─────────────────────────────────────────────────────────────────────────────
// FilterSection — labeled group inside the modal
// ─────────────────────────────────────────────────────────────────────────────

const FilterSection: React.FC<{
  title: string;
  children: React.ReactNode;
  c: ReturnType<typeof useThemeColors>;
}> = ({ title, children, c }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: c.text.muted }]}>{title}</Text>
    {children}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// ChipGroup — horizontal wrap of selectable chips
// ─────────────────────────────────────────────────────────────────────────────

interface ChipGroupProps {
  options:  { value: string; label: string; color?: string }[];
  value:    string;
  onChange: (v: string) => void;
  c:        ReturnType<typeof useThemeColors>;
}

const ChipGroup: React.FC<ChipGroupProps> = ({ options, value, onChange, c }) => (
  <View style={styles.chipGroup}>
    {options.map((opt) => {
      const isActive = opt.value === value;
      const color    = opt.color ?? c.interactive.primary;
      return (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[
            styles.filterChip,
            {
              backgroundColor: isActive ? color + '22' : c.surface.elevated,
              borderColor:     isActive ? color        : c.border.primary,
              borderWidth:     isActive ? 1.5          : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={opt.label}
        >
          {opt.color && (
            <View style={[styles.chipDot, { backgroundColor: opt.color }]} />
          )}
          <Text style={[
            styles.filterChipText,
            { color: isActive ? color : c.text.secondary, fontWeight: isActive ? FontWeight.bold : FontWeight.medium },
          ]}>
            {opt.label}
          </Text>
          {isActive && (
            <Ionicons name="checkmark" size={11} color={color} />
          )}
        </Pressable>
      );
    })}
  </View>
);

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

  onSearchChange:      (v: string) => void;
  onStatusChange:      (v: string) => void;
  onPriorityChange:    (v: string) => void;
  onUserChange:        (v: string) => void;
  onCustomerChange:    (v: string) => void;
  onApplicationChange: (v: string) => void;
  onToggleOverdue:     () => void;
  onToggleDeleted:     () => void;
  onClearFilters:      () => void;
  onViewModeChange:    (mode: ViewMode) => void;
  onRefresh:           () => void;

  users?:            User[];
  customers?:        Customer[];
  applications?:     Application[];
  userTicketCounts?: Record<string, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketFeedFilter: React.FC<TicketFeedFilterProps> = ({
  filters,
  viewMode,
  isAdmin,
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
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Count active filters for badge
  const activeFilterCount = [
    filters.status,
    filters.priority,
    filters.userId,
    filters.customerId,
    filters.applicationId,
    filters.overdue ? 'overdue' : '',
    filters.deleted ? 'deleted' : '',
  ].filter(Boolean).length;

  const userOptions = [
    { value: '', label: 'All Users' },
    { value: 'UNASSIGNED', label: 'Unassigned' },
    ...users.map((u) => ({
      value: u.id,
      label: `${u.name}${userTicketCounts[u.id] ? ` (${userTicketCounts[u.id]})` : ''}`,
    })),
  ];

  const customerOptions = [
    { value: '', label: 'All Customers' },
    ...customers.map((cu) => ({ value: cu.id, label: cu.name })),
  ];

  const applicationOptions = [
    { value: '', label: 'All Applications' },
    ...applications.map((a) => ({ value: a.id, label: a.name })),
  ];

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
          <Text style={[styles.headerTitle, { color: c.text.primary }]}>Ticket Feed</Text>
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

          {/* Refresh */}
          <Pressable
            onPress={onRefresh}
            style={[styles.iconBtn, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh"
          >
            <Ionicons name="refresh-outline" size={16} color={isRefreshing ? c.interactive.primary : c.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* ── Search + Filters button row ─────────────────────────────────────── */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchWrap}>
          <AppTextInput
            fieldType="search"
            value={filters.search}
            onChangeText={onSearchChange}
            placeholder="Search tickets, users, customers..."
            showClearButton
            onClear={() => onSearchChange('')}
          />
        </View>

        {/* Filters button */}
        <Pressable
          onPress={() => setFilterModalOpen(true)}
          style={[
            styles.filtersBtn,
            {
              backgroundColor: activeFilterCount > 0 ? c.interactive.primary : c.surface.elevated,
              borderColor:     activeFilterCount > 0 ? c.interactive.primary : c.border.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={activeFilterCount > 0 ? c.text.inverse : c.text.secondary}
          />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: c.text.inverse }]}>
              <Text style={[styles.filterBadgeText, { color: c.interactive.primary }]}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>


      {/* ── Filter Modal ─────────────────────────────────────────────────────── */}
      <Modal
        visible={filterModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalOpen(false)}
      >
        {/* Backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={() => setFilterModalOpen(false)}
        />

        {/* Sheet */}
        <View style={[styles.sheet, { backgroundColor: c.surface.primary }]}>
          <SafeAreaView edges={['bottom']}>
            {/* Handle */}
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: c.border.primary }]} />
            </View>

            {/* Modal header */}
            <View style={[styles.modalHeader, { borderBottomColor: c.border.primary }]}>
              <Text style={[styles.modalTitle, { color: c.text.primary }]}>Filters</Text>
              <View style={styles.modalHeaderRight}>
                {activeFilterCount > 0 && (
                  <Pressable
                    onPress={() => { onClearFilters(); setFilterModalOpen(false); }}
                    style={[styles.clearAllBtn, { borderColor: c.intent.error + '44' }]}
                  >
                    <Text style={[styles.clearAllText, { color: c.intent.error }]}>Clear all</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => setFilterModalOpen(false)}
                  style={[styles.doneBtn, { backgroundColor: c.interactive.primary }]}
                >
                  <Text style={[styles.doneBtnText, { color: c.text.inverse }]}>Done</Text>
                </Pressable>
              </View>
            </View>

            {/* Scrollable filter content */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Status */}
              <FilterSection title="STATUS" c={c}>
                <ChipGroup
                  options={STATUS_OPTIONS}
                  value={filters.status}
                  onChange={onStatusChange}
                  c={c}
                />
              </FilterSection>

              {/* Priority */}
              <FilterSection title="PRIORITY" c={c}>
                <ChipGroup
                  options={PRIORITY_OPTIONS}
                  value={filters.priority}
                  onChange={onPriorityChange}
                  c={c}
                />
              </FilterSection>

              {/* User (admin only) */}
              {isAdmin && users.length > 0 && (
                <FilterSection title="ASSIGNED TO" c={c}>
                  <ChipGroup
                    options={userOptions}
                    value={filters.userId}
                    onChange={onUserChange}
                    c={c}
                  />
                </FilterSection>
              )}

              {/* Customer (admin only) */}
              {isAdmin && customers.length > 0 && (
                <FilterSection title="CUSTOMER" c={c}>
                  <ChipGroup
                    options={customerOptions}
                    value={filters.customerId}
                    onChange={onCustomerChange}
                    c={c}
                  />
                </FilterSection>
              )}

              {/* Application (admin only) */}
              {isAdmin && applications.length > 0 && (
                <FilterSection title="APPLICATION" c={c}>
                  <ChipGroup
                    options={applicationOptions}
                    value={filters.applicationId}
                    onChange={onApplicationChange}
                    c={c}
                  />
                </FilterSection>
              )}

              {/* Toggles */}
              <FilterSection title="OTHER" c={c}>
                <View style={styles.toggleRow}>
                  {/* Overdue */}
                  <Pressable
                    onPress={onToggleOverdue}
                    style={[
                      styles.toggleChip,
                      {
                        backgroundColor: filters.overdue ? Palette.red500 + '22' : c.surface.elevated,
                        borderColor:     filters.overdue ? Palette.red500        : c.border.primary,
                        borderWidth:     filters.overdue ? 1.5                   : 1,
                      },
                    ]}
                    accessibilityRole="button"
                  >
                    <Ionicons name="warning-outline" size={14} color={filters.overdue ? Palette.red500 : c.text.secondary} />
                    <Text style={[styles.toggleChipText, { color: filters.overdue ? Palette.red500 : c.text.secondary }]}>
                      Overdue only
                    </Text>
                    {filters.overdue && <Ionicons name="checkmark" size={12} color={Palette.red500} />}
                  </Pressable>

                  {/* Deleted (admin only) */}
                  {isAdmin && (
                    <Pressable
                      onPress={onToggleDeleted}
                      style={[
                        styles.toggleChip,
                        {
                          backgroundColor: filters.deleted ? Palette.zinc600 + '22' : c.surface.elevated,
                          borderColor:     filters.deleted ? Palette.zinc600        : c.border.primary,
                          borderWidth:     filters.deleted ? 1.5                    : 1,
                        },
                      ]}
                      accessibilityRole="button"
                    >
                      <Ionicons name="trash-outline" size={14} color={filters.deleted ? Palette.zinc500 : c.text.secondary} />
                      <Text style={[styles.toggleChipText, { color: filters.deleted ? Palette.zinc500 : c.text.secondary }]}>
                        Show deleted
                      </Text>
                      {filters.deleted && <Ionicons name="checkmark" size={12} color={Palette.zinc500} />}
                    </Pressable>
                  )}
                </View>
              </FilterSection>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
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

  // ── Header ─────────────────────────────────────────────────────────────────
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
  iconBtn: {
    width:          32,
    height:         32,
    borderRadius:   Radius.lg,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // ── Search + Filters row ───────────────────────────────────────────────────
  searchFilterRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    gap:               Spacing.sm,
    marginBottom : -15
  },
  searchWrap: {
    flex: 1,
  },
  filtersBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.xs,
    paddingHorizontal: Spacing.md,
    height:         45,
    borderRadius:   Radius.lg,
    borderWidth:    1,
    marginBottom : 15
  },
  filterBadge: {
    minWidth:          16,
    height:            16,
    borderRadius:      8,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    fontSize:   9,
    fontWeight: FontWeight.bold,
  },

  // ── Quick chips ────────────────────────────────────────────────────────────
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

  // ── Summary bar ────────────────────────────────────────────────────────────
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

  // ── Modal ──────────────────────────────────────────────────────────────────
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position:             'absolute',
    bottom:               0,
    left:                 0,
    right:                0,
    maxHeight:            '85%',
    borderTopLeftRadius:  Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow:             'hidden',
  },
  handleRow: {
    alignItems:    'center',
    paddingTop:    Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  clearAllBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs,
    borderRadius:      Radius.full,
    borderWidth:       1,
  },
  clearAllText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  doneBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical:   Spacing.xs,
    borderRadius:      Radius.full,
  },
  doneBtnText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalContent: {
    paddingBottom: Spacing.xl,
  },

  // ── Filter sections ────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop:        Spacing.md,
    gap:               Spacing.sm,
  },
  sectionTitle: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.bold,
    letterSpacing: 0.8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  filterChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
  },
  filterChipText: {
    fontSize: FontSize.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  toggleChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
  },
  toggleChipText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});

export default TicketFeedFilter;
