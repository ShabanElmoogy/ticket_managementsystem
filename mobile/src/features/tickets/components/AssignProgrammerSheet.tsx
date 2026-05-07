/**
 * AssignProgrammerSheet — Bottom sheet for assigning a programmer to a ticket.
 *
 * Fetches PROGRAMMER-role users, shows a list with InitialAvatar + name + email,
 * highlights the currently assigned programmer, and calls ticketsApi.assignProgrammer
 * on confirm.
 *
 * ⚠️ MODAL PATTERN — useThemeColors() called BEFORE the Modal JSX.
 * Inner components receive resolvedColors prop.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native') as any;
const FlatList = RN.FlatList as any;
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import { useThemeColors } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';
import { QUERY_KEYS, USERS } from '@/src/constants/api';
import { ticketsApi } from '@/src/features/tickets/api/tickets';
import { BaseApiService } from '@/src/services/api/base';
import InitialAvatar from '@/src/shared/components/display/InitialAvatar';
import type { ThemeColors } from '@/src/constants/tokens';
import type { User } from '@/src/services/api/types/user';

// ─────────────────────────────────────────────────────────────────────────────
// Programmers API service
// ─────────────────────────────────────────────────────────────────────────────

class ProgrammersApiService extends BaseApiService {
  getProgrammers = () => this.get<User[]>(USERS.PROGRAMMERS);
}

const programmersApi = new ProgrammersApiService();

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface AssignProgrammerSheetProps {
  ticketId: string;
  currentProgrammerId?: string;
  visible: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const AssignProgrammerSheet: React.FC<AssignProgrammerSheetProps> = ({
  ticketId,
  currentProgrammerId,
  visible,
  onClose,
  onAssigned,
}) => {
  // ✅ useThemeColors() called BEFORE the Modal JSX — Modal-safe pattern
  const c = useThemeColors();
  const direction = useUiStore((s) => s.direction);
  const queryClient = useQueryClient();

  const [selectedProgrammerId, setSelectedProgrammerId] = useState<string | null>(
    currentProgrammerId ?? null
  );

  const { data: programmers = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.USERS.all, 'programmers'],
    queryFn: () => programmersApi.getProgrammers(),
    enabled: visible,
  });

  const assignMutation = useMutation({
    mutationFn: (programmerId: string) =>
      ticketsApi.assignProgrammer(ticketId, programmerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.all });
      onAssigned();
      onClose();
    },
  });

  const handleConfirm = () => {
    if (!selectedProgrammerId) return;
    assignMutation.mutate(selectedProgrammerId);
  };

  const hasSelection = !!selectedProgrammerId;
  const isReassign = !!currentProgrammerId;

  const renderProgrammer = ({ item }: { item: User }) => {
    const isSelected = item.id === selectedProgrammerId;
    const isCurrent = item.id === currentProgrammerId;

    return (
      <Pressable
        onPress={() => setSelectedProgrammerId(item.id)}
        accessibilityRole="radio"
        accessibilityLabel={`${item.name}, ${item.email}`}
        accessibilityState={{ checked: isSelected }}
        style={({ pressed }: { pressed: boolean }) => [
          styles.programmerRow,
          {
            backgroundColor: isSelected
              ? `${c.interactive.primary}12`
              : pressed
              ? c.interactive.pressed
              : 'transparent',
            borderColor: isSelected
              ? `${c.interactive.primary}44`
              : c.border.primary,
            borderStartWidth: isSelected ? 3 : 0,
          },
        ]}
      >
        <InitialAvatar name={item.name} size={36} />
        <View style={styles.programmerInfo}>
          <View style={styles.programmerNameRow}>
            <Text
              style={[
                styles.programmerName,
                { color: c.text.primary, textAlign: direction === 'rtl' ? 'right' : 'left' },
              ]}
            >
              {item.name}
            </Text>
            {isCurrent && (
              <View
                style={[
                  styles.currentBadge,
                  {
                    backgroundColor: `${c.interactive.primary}18`,
                    borderColor: `${c.interactive.primary}44`,
                  },
                ]}
              >
                <Text style={[styles.currentBadgeText, { color: c.interactive.primary }]}>
                  Current
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.programmerEmail,
              { color: c.text.muted, textAlign: direction === 'rtl' ? 'right' : 'left' },
            ]}
            numberOfLines={1}
          >
            {item.email}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={c.interactive.primary} />
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close sheet"
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: c.surface.card,
            direction: direction === 'rtl' ? 'rtl' : 'ltr',
          },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: c.border.secondary }]} />

        {/* Header */}
        <View
          style={[
            styles.sheetHeader,
            {
              borderBottomColor: c.border.primary,
              flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
            },
          ]}
        >
          <Text style={[styles.sheetTitle, { color: c.text.primary }]}>
            {isReassign ? 'Reassign Programmer' : 'Assign Programmer'}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }: { pressed: boolean }) => [
              styles.closeButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="close-outline" size={22} color={c.text.secondary} />
          </Pressable>
        </View>

        {/* Programmer list */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={c.interactive.primary} />
          </View>
        ) : programmers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={c.text.muted} />
            <Text style={[styles.emptyText, { color: c.text.muted }]}>
              No programmers available
            </Text>
          </View>
        ) : (
          <FlatList
            data={programmers}
            keyExtractor={(item: User) => item.id}
            renderItem={renderProgrammer}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Confirm button */}
        <View
          style={[
            styles.footer,
            { borderTopColor: c.border.primary },
          ]}
        >
          <Pressable
            onPress={handleConfirm}
            disabled={!hasSelection || assignMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel={isReassign ? 'Reassign Programmer' : 'Assign Programmer'}
            style={({ pressed }: { pressed: boolean }) => [
              styles.confirmButton,
              {
                backgroundColor:
                  !hasSelection || assignMutation.isPending
                    ? c.interactive.disabled
                    : pressed
                    ? c.interactive.primaryPressed
                    : c.interactive.primary,
              },
            ]}
          >
            {assignMutation.isPending ? (
              <ActivityIndicator size="small" color={c.text.inverse} />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={16} color={c.text.inverse} />
                <Text style={[styles.confirmButtonText, { color: c.text.inverse }]}>
                  {isReassign ? 'Reassign Programmer' : 'Assign Programmer'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopStartRadius: Radius['2xl'],
    borderTopEndRadius: Radius['2xl'],
    maxHeight: '75%',
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: 8,
  },
  sheetTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: FontSize.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    gap: 4,
  },
  programmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: 4,
    gap: 10,
  },
  programmerInfo: {
    flex: 1,
    gap: 2,
  },
  programmerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  programmerName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  currentBadge: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },
  programmerEmail: {
    fontSize: FontSize.xs,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.xl,
    paddingVertical: 14,
  },
  confirmButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
});

export default AssignProgrammerSheet;
