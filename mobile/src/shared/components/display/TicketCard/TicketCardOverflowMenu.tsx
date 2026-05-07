/**
 * TicketCardOverflowMenu — bottom-sheet style action menu for ticket card actions.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────────────────╮
 * │  ▬▬▬▬▬  (drag handle)                                               │
 * │  Ticket title (truncated)                                            │
 * │  ─────────────────────────────────────────────────────────────────  │
 * │  👁  View Details                                                    │
 * │  ─────────────────────────────────────────────────────────────────  │
 * │  ⇄  Mark as Open                                                    │
 * │  ⇄  Mark as In Progress                                             │
 * │  ⇄  Mark as Resolved                                                │
 * │  ⇄  Mark as Closed                                                  │
 * │  ─────────────────────────────────────────────────────────────────  │
 * │  📅  Edit Due Date                                                   │
 * │  👤  Reassign Ticket                                                 │
 * │  </> Send to Programmer                                              │
 * │  ─────────────────────────────────────────────────────────────────  │
 * │  🗑  Delete Ticket                                                   │
 * │  ♻  Restore Ticket                                                  │
 * ╰──────────────────────────────────────────────────────────────────────╯
 *
 * Rendered via React Native `Modal` (transparent, slide-up animation).
 * A semi-transparent backdrop closes the menu on press.
 *
 * All actions are role-gated via `buildOverflowMenuEntries` from
 * `TicketCardActionBar` — no duplication of guard logic here.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Radius,
  FontSize,
  FontWeight,
  Spacing,
} from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Ticket, TicketStatus } from '@/src/services/api/types/ticket';
import {
  buildOverflowMenuEntries,
  type OverflowMenuEntry,
  type OverflowMenuItem,
} from './TicketCardActionBar';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Animation duration in ms. */
const ANIMATION_DURATION = 260;

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCardOverflowMenuProps {
  /** Whether the menu is visible. */
  visible: boolean;
  /** Called when the menu should close (backdrop press, close button). */
  onClose: () => void;
  /** The ticket data — used for title display and role/state guards. */
  ticket: Ticket;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** Whether the current user is a TENANT_ADMIN. */
  isAdmin: boolean;
  /** The current authenticated user's ID. */
  currentUserId: string;
  /** When true, all write actions are disabled (subscription suspended). */
  tenantSuspended?: boolean;
  /** Called when "View Details" is selected. */
  onViewDetails: () => void;
  /** Called when a status update is selected. */
  onStatusChange?: (status: TicketStatus) => void;
  /** Called when "Edit Due Date" is selected. */
  onEditDueDate?: () => void;
  /** Called when "Reassign Ticket" is selected. */
  onReassign?: () => void;
  /** Called when "Send to Programmer" / "Reassign Programmer" is selected. */
  onAssignProgrammer?: () => void;
  /** Called when "Delete Ticket" is selected. */
  onDelete?: () => void;
  /** Called when "Restore Ticket" is selected. */
  onRestore?: () => void;
  /** Extra style merged onto the sheet container. */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface MenuItemRowProps {
  item: OverflowMenuItem;
  resolvedColors: ThemeColors;
  onPress: () => void;
}

/**
 * A single tappable row in the overflow menu.
 * Shows an icon on the start side, a label, and an optional disabled overlay.
 */
const MenuItemRow: React.FC<MenuItemRowProps> = ({ item, resolvedColors: c, onPress }) => {
  const isDisabled = item.disabled === true;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={isDisabled ? undefined : handlePress}
      disabled={isDisabled}
      accessibilityRole="menuitem"
      accessibilityLabel={item.label}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }: { pressed: boolean }) => [
        styles.menuItem,
        {
          backgroundColor:
            pressed && !isDisabled
              ? `${item.color}10`
              : 'transparent',
          opacity: isDisabled ? 0.4 : 1,
        },
      ]}
    >
      <View style={styles.rowContainer}>
        {/* Label */}
        <Text
          style={[
            styles.menuItemLabel,
            { 
              color: isDisabled ? c.text.muted : (item.color === c.interactive.primary ? c.text.primary : item.color),
              fontWeight: item.color === c.interactive.primary ? FontWeight.bold : FontWeight.medium
            },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>

        {/* Icon (Behind Text) */}
        <View
          style={[
            styles.menuItemIconWrapper,
            { backgroundColor: `${item.color}15` },
          ]}
        >
          <Ionicons
            name={item.icon as any}
            size={20}
            color={isDisabled ? c.text.muted : item.color}
          />
        </View>

        {/* Disabled lock icon */}
        {isDisabled && (
          <Ionicons
            name="lock-closed-outline"
            size={14}
            color={c.text.muted}
            style={styles.menuItemEndIcon}
          />
        )}
      </View>
    </Pressable>
  );
};

interface MenuDividerProps {
  resolvedColors: ThemeColors;
}

/** A thin horizontal rule between menu groups. */
const MenuDivider: React.FC<MenuDividerProps> = ({ resolvedColors: c }) => (
  <View style={[styles.divider, { backgroundColor: c.border.primary }]} />
);

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketCardOverflowMenu: React.FC<TicketCardOverflowMenuProps> = ({
  visible,
  onClose,
  ticket,
  resolvedColors: c,
  isAdmin,
  currentUserId,
  tenantSuspended = false,
  onViewDetails,
  onStatusChange,
  onEditDueDate,
  onReassign,
  onAssignProgrammer,
  onDelete,
  onRestore,
  style,
}) => {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;

  // ── Build menu entries via shared helper ──────────────────────────────────
  const menuEntries: OverflowMenuEntry[] = buildOverflowMenuEntries(ticket, {
    isAdmin,
    currentUserId,
    tenantSuspended,
    onViewDetails,
    onStatusChange,
    onEditDueDate,
    onReassign,
    onAssignProgrammer,
    onDelete,
    onRestore,
    resolvedColors: c,
  });

  // ── Action handler — closes menu then fires callback ──────────────────────
  const handleItemPress = useCallback(
    (item: OverflowMenuItem) => {
      onClose();
      // Small delay so the sheet animates out before the action fires
      setTimeout(() => {
        item.onPress();
      }, ANIMATION_DURATION + 50);
    },
    [onClose],
  );

  // ── Ticket title for the sheet header ─────────────────────────────────────
  const ticketTitle = ticket.title ?? 'Ticket Actions';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
      accessibilityViewIsModal
    >
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <Pressable
        style={[styles.backdrop]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close menu"
      />

      {/* ── Sheet ────────────────────────────────────────────────────────── */}
      <View
        style={styles.sheetWrapper}
        accessibilityRole="menu"
        accessibilityLabel="Ticket actions menu"
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: c.surface.card,
              maxHeight: MAX_SHEET_HEIGHT,
              shadowColor: c.shadow,
            },
            style,
          ]}
        >
          {/* ── Drag handle ──────────────────────────────────────────────── */}
          <View style={styles.handleWrapper} accessibilityElementsHidden>
            <View
              style={[styles.handle, { backgroundColor: c.border.secondary }]}
            />
          </View>

          {/* ── Sheet header — ticket title ───────────────────────────────── */}
          <View
            style={[
              styles.sheetHeader,
              { borderBottomColor: c.border.primary },
            ]}
          >
            <View style={styles.headerContent}>
              <Text
                style={[styles.sheetTitle, { color: c.text.primary }]}
                numberOfLines={1}
                accessibilityRole="header"
              >
                {ticketTitle}
              </Text>
              <View style={styles.headerSubtitle}>
                <Text style={[styles.ticketId, { color: c.text.muted }]}>
                  #{ticket.id.slice(0, 8)}
                </Text>
                <Text style={[styles.dot, { color: c.text.muted }]}>•</Text>
                <Text style={[styles.statusText, { color: c.text.secondary }]}>
                  {ticket.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            {/* Close button */}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }: { pressed: boolean }) => [
                styles.closeButton,
                {
                  backgroundColor: pressed
                    ? c.surface.elevated
                    : `${c.border.primary}80`,
                },
              ]}
            >
              <Ionicons
                name="close-outline"
                size={18}
                color={c.text.secondary}
              />
            </Pressable>
          </View>

          {/* ── Suspended banner ─────────────────────────────────────────── */}
          {tenantSuspended && (
            <View
              style={[
                styles.suspendedBanner,
                {
                  backgroundColor: c.intent.warningSurface,
                  borderColor: `${c.intent.warning}44`,
                },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={14}
                color={c.intent.warning}
              />
              <Text
                style={[styles.suspendedText, { color: c.intent.warning }]}
              >
                Subscription ended — write actions are disabled
              </Text>
            </View>
          )}

          {/* ── Menu items ───────────────────────────────────────────────── */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {menuEntries.map((entry) => {
              if (entry.type === 'divider') {
                return (
                  <View key={entry.key}>
                    <MenuDivider resolvedColors={c} />
                  </View>
                );
              }

              return (
                <View key={entry.key}>
                  <MenuItemRow
                    item={entry}
                    resolvedColors={c}
                    onPress={() => handleItemPress(entry)}
                   
                  />
                </View>
              );
            })}

            {/* Bottom safe-area padding */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Backdrop ───────────────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  // ── Sheet wrapper — anchored to bottom ────────────────────────────────────
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  // ── Sheet container ────────────────────────────────────────────────────────
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    overflow: 'hidden',
    // Shadow values (shadowColor overridden inline with c.shadow)
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    // Elevation (Android)
    elevation: 16,
  },

  // ── Drag handle ────────────────────────────────────────────────────────────
  handleWrapper: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  // ── Sheet header ───────────────────────────────────────────────────────────
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  sheetTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    lineHeight: 22,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Suspended banner ───────────────────────────────────────────────────────
  suspendedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  suspendedText: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
  },

  // ── Scroll view ────────────────────────────────────────────────────────────
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingTop: Spacing.xs,
  },

  // ── Menu item row ──────────────────────────────────────────────────────────
  menuItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 80, // Even more vertical spac
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    width: '95%',
    marginBottom : 7,
    marginTop : 7,
    marginStart : 10
  },
  menuItemIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  menuItemLabel: {
  flex: 1,
  flexShrink: 1,
  fontSize: FontSize.xl,
  fontWeight: FontWeight.medium,
  lineHeight: 25,
  },
  menuItemEndIcon: {
    marginStart: Spacing.xs,
    opacity: 0.6,
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketId: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    textTransform: 'capitalize',
  },
  dot: {
    fontSize: 10,
  },

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },

  // ── Bottom padding (safe area) ─────────────────────────────────────────────
  bottomPadding: {
    height: Platform.OS === 'ios' ? 34 : Spacing.lg,
  },
});

export default TicketCardOverflowMenu;
