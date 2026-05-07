/**
 * TechnicalInfoSection — Technical Info sub-tab of the Programming Panel.
 *
 * Renders:
 *   - Technical Description (multiline AppTextInput)
 *   - Root Cause Analysis   (multiline AppTextInput)
 *   - Steps to Reproduce    (multiline AppTextInput)
 *   - Estimated Hours + Actual Hours Spent (side-by-side number inputs)
 *   - 💾 Save button (disabled when canEdit=false or saving)
 *
 * All inputs are disabled when canEdit=false (read-only mode).
 * The component manages its own local draft state so the user can edit
 * freely before pressing Save.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppTextInput from '@/src/shared/components/forms/AppTextInput';
import AppButton    from '@/src/shared/components/forms/AppButton';
import { useThemeColors } from '@/src/constants/theme';
import { FontSize, FontWeight, Radius, Spacing, Palette } from '@/src/constants/tokens';
import type { ProgrammingDetails } from '@/src/services/api/types/programming';
import type { TechnicalInfoPayload } from '../hooks/useProgrammingDetails';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TechnicalInfoSectionProps {
  /** Current programming details from the server. */
  programming: ProgrammingDetails | undefined;
  /** Whether the current user can edit this section. */
  canEdit: boolean;
  /** Called when the user presses Save. */
  onSave: (payload: TechnicalInfoPayload) => Promise<void>;
  /** Whether a save is in progress. */
  isSaving: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TechnicalInfoSection: React.FC<TechnicalInfoSectionProps> = ({
  programming,
  canEdit,
  onSave,
  isSaving,
}) => {
  const c = useThemeColors();

  // ── Local draft state ──────────────────────────────────────────────────────

  const [technicalDescription, setTechnicalDescription] = useState(
    programming?.technicalDescription ?? '',
  );
  const [rootCause, setRootCause] = useState(
    programming?.rootCause ?? '',
  );
  const [stepsToReproduce, setStepsToReproduce] = useState(
    programming?.stepsToReproduce ?? '',
  );
  const [estimatedHours, setEstimatedHours] = useState(
    programming?.estimatedHours != null ? String(programming.estimatedHours) : '',
  );
  const [actualHours, setActualHours] = useState(
    programming?.actualHours != null ? String(programming.actualHours) : '',
  );

  // Sync when server data changes (e.g. after a refetch)
  useEffect(() => {
    if (!programming) return;
    setTechnicalDescription(programming.technicalDescription ?? '');
    setRootCause(programming.rootCause ?? '');
    setStepsToReproduce(programming.stepsToReproduce ?? '');
    setEstimatedHours(
      programming.estimatedHours != null ? String(programming.estimatedHours) : '',
    );
    setActualHours(
      programming.actualHours != null ? String(programming.actualHours) : '',
    );
  }, [programming]);

  // ── Save handler ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    const payload: TechnicalInfoPayload = {
      technicalDescription: technicalDescription.trim() || undefined,
      rootCause:            rootCause.trim()            || undefined,
      stepsToReproduce:     stepsToReproduce.trim()     || undefined,
      estimatedHours:       estimatedHours ? parseFloat(estimatedHours) : undefined,
      actualHours:          actualHours    ? parseFloat(actualHours)    : undefined,
    };
    await onSave(payload);
  };

  // ── Empty state (read-only, no data) ──────────────────────────────────────

  const hasAnyData =
    technicalDescription || rootCause || stepsToReproduce || estimatedHours || actualHours;

  if (!canEdit && !hasAnyData) {
    return (
      <View style={[styles.emptyState, { backgroundColor: c.surface.secondary }]}>
        <Ionicons name="information-circle-outline" size={40} color={c.text.muted} />
        <Text style={[styles.emptyText, { color: c.text.muted }]}>
          No technical details added yet
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
      {/* Technical Description */}
      <AppTextInput
        label="Technical Description"
        value={technicalDescription}
        onChangeText={setTechnicalDescription}
        placeholder="Describe the technical context and approach..."
        multiline
        numberOfLines={4}
        maxLength={2000}
        editable={canEdit}
        containerStyle={styles.field}
      />

      {/* Root Cause Analysis */}
      <AppTextInput
        label="Root Cause Analysis"
        value={rootCause}
        onChangeText={setRootCause}
        placeholder="What is the root cause of this issue?"
        multiline
        numberOfLines={4}
        maxLength={2000}
        editable={canEdit}
        containerStyle={styles.field}
      />

      {/* Steps to Reproduce */}
      <AppTextInput
        label="Steps to Reproduce"
        value={stepsToReproduce}
        onChangeText={setStepsToReproduce}
        placeholder="1. Open the app&#10;2. Navigate to...&#10;3. Observe..."
        multiline
        numberOfLines={5}
        maxLength={2000}
        editable={canEdit}
        containerStyle={styles.field}
      />

      {/* Hours row — side by side */}
      <View style={styles.hoursRow}>
        <View style={styles.hoursField}>
          <AppTextInput
            label="Estimated Hours"
            value={estimatedHours}
            onChangeText={setEstimatedHours}
            placeholder="0"
            fieldType="number"
            min={0}
            max={9999}
            step={0.5}
            editable={canEdit}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
        <View style={styles.hoursField}>
          <AppTextInput
            label="Actual Hours Spent"
            value={actualHours}
            onChangeText={setActualHours}
            placeholder="0"
            fieldType="number"
            min={0}
            max={9999}
            step={0.5}
            editable={canEdit}
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
      </View>

      {/* Save button */}
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
          Save Technical Info
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
  field: {
    marginBottom: Spacing.md,
  },
  hoursRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  hoursField: {
    flex: 1,
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

export default TechnicalInfoSection;
