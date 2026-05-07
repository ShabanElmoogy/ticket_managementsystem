/**
 * SolutionChecklistSection — Solution Steps sub-tab of the Programming Panel.
 *
 * Renders:
 *   - Progress caption: "X / Y steps completed"
 *   - List of ChecklistItem rows (toggle done, delete)
 *   - "Add a step..." AppTextInput + "+" button (submits on Enter / return key)
 *   - 💾 Save Steps button
 *
 * The component manages local draft state for the steps array.
 * Pressing Save calls onSave with the current steps.
 * canEdit=false hides the add input and Save button, and disables toggles.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChecklistItem from '@/src/shared/components/display/ChecklistItem';
import AppTextInput  from '@/src/shared/components/forms/AppTextInput';
import AppButton     from '@/src/shared/components/forms/AppButton';
import { useThemeColors } from '@/src/constants/theme';
import { FontSize, FontWeight, Radius, Spacing, Palette } from '@/src/constants/tokens';
import { addStep, removeStep } from '../utils/stepUtils';
import type { SolutionStep } from '@/src/services/api/types/programming';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface SolutionChecklistSectionProps {
  /** Current solution steps from the server. */
  steps: SolutionStep[];
  /** Whether the current user can edit steps. */
  canEdit: boolean;
  /** Called when the user presses Save Steps. */
  onSave: (steps: SolutionStep[]) => Promise<void>;
  /** Whether a save is in progress. */
  isSaving: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const SolutionChecklistSection: React.FC<SolutionChecklistSectionProps> = ({
  steps: serverSteps,
  canEdit,
  onSave,
  isSaving,
}) => {
  const c = useThemeColors();
  const addInputRef = useRef<any>(null);

  // ── Local draft state ──────────────────────────────────────────────────────

  const [steps, setSteps] = useState<SolutionStep[]>(serverSteps);
  const [newStepText, setNewStepText] = useState('');

  // Sync when server data changes
  useEffect(() => {
    setSteps(serverSteps);
  }, [serverSteps]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const completedCount = steps.filter((s) => s.done).length;
  const totalCount     = steps.length;
  const progressPct    = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleToggle = (order: number) => {
    setSteps((prev) =>
      prev.map((s) => (s.order === order ? { ...s, done: !s.done } : s)),
    );
  };

  const handleDelete = (order: number) => {
    setSteps((prev) => removeStep(prev, order));
  };

  const handleAddStep = () => {
    const text = newStepText.trim();
    if (!text) return;
    setSteps((prev) => addStep(prev, text));
    setNewStepText('');
    // Re-focus the input for rapid entry
    setTimeout(() => addInputRef.current?.focus(), 50);
  };

  const handleSave = async () => {
    await onSave(steps);
  };

  // ── Empty state (read-only, no steps) ─────────────────────────────────────

  if (!canEdit && steps.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: c.surface.secondary }]}>
        <Ionicons name="checkmark-circle-outline" size={40} color={c.text.muted} />
        <Text style={[styles.emptyText, { color: c.text.muted }]}>
          No solution steps added yet
        </Text>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Progress caption */}
      {totalCount > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressCaption, { color: c.text.secondary }]}>
              {completedCount} / {totalCount} steps completed
            </Text>
            <Text style={[styles.progressPct, { color: c.interactive.primary }]}>
              {Math.round(progressPct)}%
            </Text>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: c.border.primary }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%` as any,
                  backgroundColor:
                    progressPct === 100
                      ? c.intent.success
                      : c.interactive.primary,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Steps list */}
      {steps.length > 0 ? (
        <View style={styles.stepsList}>
          {steps.map((step) => (
            <View key={step.order}>
              <ChecklistItem
                step={step}
                canEdit={canEdit}
                onToggle={handleToggle}
                onDelete={canEdit ? handleDelete : undefined}
                resolvedColors={c}
                style={styles.stepItem}
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.noStepsHint, { borderColor: c.border.primary }]}>
          <Ionicons name="list-outline" size={20} color={c.text.muted} />
          <Text style={[styles.noStepsText, { color: c.text.muted }]}>
            No steps yet — add one below
          </Text>
        </View>
      )}

      {/* Add step input — only shown when canEdit */}
      {canEdit && (
        <View style={styles.addRow}>
          <View style={styles.addInputWrapper}>
            <AppTextInput
              inputRef={addInputRef}
              value={newStepText}
              onChangeText={setNewStepText}
              placeholder="Add a step..."
              maxLength={300}
              showClearButton
              onClear={() => setNewStepText('')}
              onSubmitEditing={handleAddStep}
              returnKeyType="done"
              blurOnSubmit={false}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          {/* + button */}
          <Pressable
            onPress={handleAddStep}
            disabled={!newStepText.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add step"
            style={({ pressed }: { pressed: boolean }) => [
              styles.addButton,
              {
                backgroundColor:
                  !newStepText.trim()
                    ? c.interactive.disabled
                    : pressed
                    ? c.interactive.primaryPressed
                    : c.interactive.primary,
              },
            ]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Save Steps button */}
      {canEdit && (
        <AppButton
          variant="primary"
          onPress={handleSave}
          loading={isSaving}
          loadingText="Saving..."
          fullWidth
          style={styles.saveButton}
          leftIcon={
            !isSaving ? (
              <Ionicons name="save-outline" size={16} color="#fff" />
            ) : undefined
          }
        >
          Save Steps
        </AppButton>
      )}
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  progressSection: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressCaption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  progressPct: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  stepsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stepItem: {
    // Individual step spacing handled by gap above
  },
  noStepsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noStepsText: {
    fontSize: FontSize.sm,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addInputWrapper: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28, // align with input (label height ~28px)
  },
  saveButton: {
    marginTop: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    margin: Spacing.md,
    padding: Spacing['2xl'],
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
});

export default SolutionChecklistSection;
