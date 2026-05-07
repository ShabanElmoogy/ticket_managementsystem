/**
 * ChecklistItem — solution step row with checkbox, strikethrough text, and optional delete.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. SolutionChecklistSection.tsx — list of solution steps in the Programming Panel
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────╮
 * │  [✓]  Step text (strikethrough when done)          [🗑]  │
 * ╰──────────────────────────────────────────────────────────╯
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * // Editable step
 * <ChecklistItem
 *   step={{ order: 0, text: 'Write unit tests', done: false }}
 *   canEdit
 *   onToggle={(order) => handleToggle(order)}
 *   onDelete={(order) => handleDelete(order)}
 *   resolvedColors={c}
 * />
 *
 * // Read-only step (no delete button)
 * <ChecklistItem
 *   step={{ order: 1, text: 'Deploy to staging', done: true }}
 *   canEdit={false}
 *   onToggle={() => {}}
 *   resolvedColors={c}
 * />
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing } from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';
import type { SolutionStep } from '@/src/services/api/types/programming';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface ChecklistItemProps {
  /** The solution step data. */
  step: SolutionStep;
  /** Whether the user can toggle/delete this step. */
  canEdit: boolean;
  /** Called when the checkbox is toggled. Receives the step's `order`. */
  onToggle: (order: number) => void;
  /** Called when the delete button is pressed. Receives the step's `order`. */
  onDelete?: (order: number) => void;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** Extra style merged onto the root container. */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  step,
  canEdit,
  onToggle,
  onDelete,
  resolvedColors: c,
  style,
}) => {
  const handleToggle = () => {
    if (canEdit) onToggle(step.order);
  };

  const handleDelete = () => {
    if (canEdit && onDelete) onDelete(step.order);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: step.done ? `${c.intent.success}0A` : c.surface.card,
          borderColor: step.done ? `${c.intent.success}33` : c.border.primary,
        },
        style,
      ]}
      accessibilityRole="none"
    >
      {/* Step number badge */}
      <View
        style={[
          styles.orderBadge,
          { backgroundColor: `${c.interactive.primary}18` },
        ]}
      >
        <Text style={[styles.orderText, { color: c.interactive.primary }]}>
          {step.order + 1}
        </Text>
      </View>

      {/* Checkbox */}
      <Pressable
        onPress={handleToggle}
        disabled={!canEdit}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: step.done }}
        accessibilityLabel={`Step ${step.order + 1}: ${step.text}`}
        style={({ pressed }: { pressed: boolean }) => [
          styles.checkbox,
          {
            backgroundColor: step.done
              ? c.intent.success
              : pressed && canEdit
              ? c.interactive.pressed
              : 'transparent',
            borderColor: step.done ? c.intent.success : c.border.secondary,
          },
        ]}
      >
        {step.done && (
          <Ionicons name="checkmark" size={12} color={c.text.inverse} />
        )}
      </Pressable>

      {/* Step text */}
      <Text
        style={[
          styles.stepText,
          {
            color: step.done ? c.text.muted : c.text.primary,
            textDecorationLine: step.done ? 'line-through' : 'none',
          },
        ]}
        numberOfLines={3}
      >
        {step.text}
      </Text>

      {/* Delete button — only shown when canEdit and onDelete provided */}
      {canEdit && onDelete && (
        <Pressable
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete step ${step.order + 1}`}
          style={({ pressed }: { pressed: boolean }) => [
            styles.deleteButton,
            {
              backgroundColor: pressed
                ? c.intent.errorSurface
                : 'transparent',
            },
          ]}
        >
          <Ionicons name="trash-outline" size={14} color={c.intent.error} />
        </Pressable>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  orderBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  orderText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default ChecklistItem;
