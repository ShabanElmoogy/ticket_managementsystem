/**
 * ProgrammingTicketList — left panel of the Programming screen.
 *
 * Shows:
 *   - "Programming Tickets" header with blue count badge + refresh icon
 *   - AppTextInput (search, fieldType="search")
 *   - Status filter chips (All + each programming-phase status)
 *   - FlatList of ticket items:
 *       initials avatar + title + status chip + "prog" label
 *   - Selected item highlighted with a left accent border
 *
 * ✅ Calls useThemeColors() internally — screen-level component, not Modal-safe.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native') as any;
const FlatList = RN.FlatList as any;
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { useDirection } from '@/src/providers/DirectionProvider';
import { Palette, Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import AppTextInput from '@/src/shared/components/forms/AppTextInput';
import Avatar from '@/src/shared/components/display/Avatar';
import type { Ticket, TicketStatus } from '@/src/services/api/types/ticket';
import type { ProgrammingStatusFilter } from '../hooks/useProgrammingTickets';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_COLOR = Palette.blue500;

/** Programming-phase statuses available as filter options */
const STATUS_OPTIONS: { value: ProgrammingStatusFilter; label: string }[] = [
  { value: '',                  label: 'All'         },
  { value: 'PROGRAMMING',       label: 'Programming' },
  { value: 'UNDER_DEVELOPMENT', label: 'Dev'         },
  { value: 'CODE_REVIEW',       label: 'Review'      },
  { value: 'TESTING',           label: 'Testing'     },
  { value: 'RESOLVED',          label: 'Resolved'    },
];

/** Status → accent color map (module-level, Palette constants) */
const STATUS_COLORS: Record<string, string> = {
  PROGRAMMING:       Palette.violet500,
  UNDER_DEVELOPMENT: Palette.indigo500,
  CODE_REVIEW:       Palette.purple500,
  TESTING:           Palette.cyan500,
  RESOLVED:          Palette.emerald500,
};

/** Derive initials from a name string */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Derive a deterministic color from a string */
function colorFromString(str: string): string {
  const COLORS = [
    Palette.blue500, Palette.violet500, Palette.emerald500,
    Palette.amber500, Palette.rose500, Palette.cyan500,
    Palette.indigo500, Palette.teal500,
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface ProgrammingTicketListProps {
  tickets:       Ticket[];
  isLoading:     boolean;
  selectedId:    string | null;
  onSelect:      (ticket: Ticket) => void;
  onRefresh:     () => void;
  search:        string;
  onSearchChange:(text: string) => void;
  statusFilter:  ProgrammingStatusFilter;
  onStatusChange:(status: ProgrammingStatusFilter) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ticket item
// ─────────────────────────────────────────────────────────────────────────────

interface TicketItemProps {
  ticket:     Ticket;
  isSelected: boolean;
  onPress:    () => void;
}

const TicketItem: React.FC<TicketItemProps> = ({ ticket, isSelected, onPress }) => {
  const c = useThemeColors();
  const { isRtl } = useDirection();

  const statusColor = STATUS_COLORS[ticket.status] ?? Palette.zinc500;
  const avatarColor = colorFromString(ticket.title);
  const initials    = getInitials(ticket.title);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={ticket.title}
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }: { pressed: boolean }) => [
        styles.ticketItem,
        {
          backgroundColor: isSelected
            ? `${PANEL_COLOR}12`
            : pressed
            ? c.surface.elevated
            : c.surface.card,
          borderColor: isSelected ? PANEL_COLOR : c.border.primary,
          // Left accent border for selected item
          borderStartWidth: isSelected ? 3 : 1,
        },
      ]}
    >
      {/* Avatar */}
      <Avatar
        text={initials}
        size={36}
        backgroundColor={avatarColor + '22'}
        textColor={avatarColor}
        fontSize={13}
        accessibilityLabel={`${ticket.title} avatar`}
      />

      {/* Content */}
      <View style={styles.ticketContent}>
        {/* Title */}
        <Text
          style={[
            styles.ticketTitle,
            {
              color:     isSelected ? PANEL_COLOR : c.text.primary,
              textAlign: isRtl ? 'right' : 'left',
              fontWeight: isSelected ? FontWeight.semibold : FontWeight.normal,
            },
          ]}
          numberOfLines={2}
        >
          {ticket.title}
        </Text>

        {/* Chips row */}
        <View style={[styles.chipsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          {/* Status chip */}
          <View
            style={[
              styles.chip,
              {
                backgroundColor: `${statusColor}22`,
                borderColor:     `${statusColor}55`,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: statusColor }]}>
              {ticket.status.replace(/_/g, ' ')}
            </Text>
          </View>

          {/* "prog" label */}
          <View
            style={[
              styles.chip,
              {
                backgroundColor: `${PANEL_COLOR}15`,
                borderColor:     `${PANEL_COLOR}44`,
              },
            ]}
          >
            <Ionicons name="code-slash-outline" size={9} color={PANEL_COLOR} />
            <Text style={[styles.chipText, { color: PANEL_COLOR }]}>prog</Text>
          </View>
        </View>
      </View>

      {/* Selected indicator chevron */}
      {isSelected && (
        <Ionicons
          name={isRtl ? 'chevron-back-outline' : 'chevron-forward-outline'}
          size={16}
          color={PANEL_COLOR}
        />
      )}
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const ProgrammingTicketList: React.FC<ProgrammingTicketListProps> = ({
  tickets,
  isLoading,
  selectedId,
  onSelect,
  onRefresh,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
}) => {
  const c = useThemeColors();
  const { isRtl } = useDirection();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: c.surface.primary, borderEndColor: c.border.primary }]}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: c.surface.card,
            borderBottomColor: c.border.primary,
            flexDirection: isRtl ? 'row-reverse' : 'row',
          },
        ]}
      >
        {/* Title + count badge */}
        <View style={[styles.headerLeft, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerIconBadge, { backgroundColor: `${PANEL_COLOR}20` }]}>
            <Ionicons name="code-slash-outline" size={14} color={PANEL_COLOR} />
          </View>
          <Text style={[styles.headerTitle, { color: c.text.primary }]}>
            Programming Tickets
          </Text>
          {/* Count badge */}
          <View style={[styles.countBadge, { backgroundColor: PANEL_COLOR }]}>
            <Text style={styles.countBadgeText}>{tickets.length}</Text>
          </View>
        </View>

        {/* Refresh button */}
        <Pressable
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh tickets"
          style={({ pressed }: { pressed: boolean }) => [
            styles.refreshButton,
            {
              backgroundColor: pressed ? c.surface.elevated : 'transparent',
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={PANEL_COLOR} />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={c.interactive.primary} />
          )}
        </Pressable>
      </View>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <View style={[styles.searchContainer, { backgroundColor: c.surface.card, borderBottomColor: c.border.primary }]}>
        <AppTextInput
          fieldType="search"
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search tickets..."
          showClearButton
          onClear={() => onSearchChange('')}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* ── Status filter chips ──────────────────────────────────────────── */}
      <View style={[styles.filterContainer, { borderBottomColor: c.border.primary }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <Pressable
                key={opt.value || 'all'}
                onPress={() => onStatusChange(opt.value)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${opt.label}`}
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? `${PANEL_COLOR}18` : c.surface.elevated,
                    borderColor:     isActive ? PANEL_COLOR : c.border.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? PANEL_COLOR : c.text.secondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Ticket list ──────────────────────────────────────────────────── */}
      {isLoading && tickets.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PANEL_COLOR} />
          <Text style={[styles.loadingText, { color: c.text.muted }]}>
            Loading tickets...
          </Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item: Ticket) => item.id}
          renderItem={({ item }: { item: Ticket }) => (
            <TicketItem
              ticket={item}
              isSelected={item.id === selectedId}
              onPress={() => onSelect(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="code-slash-outline" size={40} color={c.text.muted} />
              <Text style={[styles.emptyTitle, { color: c.text.secondary }]}>
                No programming tickets
              </Text>
              <Text style={[styles.emptySubtitle, { color: c.text.muted }]}>
                {search || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'No tickets are in a programming phase'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderEndWidth: 1,
  },

  // Header
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  headerLeft: {
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerIconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  searchInput: {
    marginBottom: Spacing.sm,
  },

  // Filter chips
  filterContainer: {
    borderBottomWidth: 1,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 6,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // List
  listContent: {
    padding: Spacing.sm,
    gap: 4,
    paddingBottom: 32,
  },

  // Ticket item
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: 4,
  },
  ticketContent: {
    flex: 1,
    gap: 4,
  },
  ticketTitle: {
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  chipsRow: {
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },

  // Loading / empty
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing['2xl'],
  },
  loadingText: {
    fontSize: FontSize.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});

export default ProgrammingTicketList;
