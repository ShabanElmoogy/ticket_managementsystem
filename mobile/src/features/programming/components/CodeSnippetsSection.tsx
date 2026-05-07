/**
 * CodeSnippetsSection — Code Snippets sub-tab of the Programming Panel.
 *
 * Renders:
 *   - List of existing snippets: language header chip + CodeBlock
 *   - Delete button per snippet (canEdit only)
 *   - Inline add form: Language selector (ChipTiles) + Label field +
 *     Code multiline AppTextInput + Add / Cancel buttons
 *   - 💾 Save button
 *
 * The component manages local draft state for the snippets array.
 * Pressing Save calls onSave with the current snippets.
 * canEdit=false hides the add form and Save button.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CodeBlock     from '@/src/shared/components/display/CodeBlock';
import AppTextInput  from '@/src/shared/components/forms/AppTextInput';
import AppButton     from '@/src/shared/components/forms/AppButton';
import { useThemeColors } from '@/src/constants/theme';
import { FontSize, FontWeight, Radius, Spacing, Palette } from '@/src/constants/tokens';
import type { CodeSnippet } from '@/src/services/api/types/programming';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++',
  'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'SQL', 'Shell',
  'HTML', 'CSS', 'JSON', 'YAML', 'XML', 'Other',
] as const;

/** Language → accent color for the header chip */
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: Palette.amber500,
  TypeScript: Palette.blue500,
  Python:     Palette.indigo500,
  Java:       Palette.orange500,
  'C#':       Palette.violet500,
  'C++':      Palette.cyan500,
  Go:         Palette.teal500,
  Rust:       Palette.orange600,
  PHP:        Palette.purple500,
  Ruby:       Palette.red500,
  Swift:      Palette.orange400,
  Kotlin:     Palette.violet400,
  SQL:        Palette.emerald500,
  Shell:      Palette.zinc500,
  HTML:       Palette.orange500,
  CSS:        Palette.blue400,
  JSON:       Palette.green500,
  YAML:       Palette.amber400,
  XML:        Palette.teal400,
  Other:      Palette.zinc400,
};

function getLanguageColor(lang: string): string {
  return LANGUAGE_COLORS[lang] ?? Palette.zinc500;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface CodeSnippetsSectionProps {
  /** Current code snippets from the server. */
  snippets: CodeSnippet[];
  /** Whether the current user can edit snippets. */
  canEdit: boolean;
  /** Called when the user presses Save. */
  onSave: (snippets: CodeSnippet[]) => Promise<void>;
  /** Whether a save is in progress. */
  isSaving: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const CodeSnippetsSection: React.FC<CodeSnippetsSectionProps> = ({
  snippets: serverSnippets,
  canEdit,
  onSave,
  isSaving,
}) => {
  const c = useThemeColors();

  // ── Local draft state ──────────────────────────────────────────────────────

  const [snippets, setSnippets] = useState<CodeSnippet[]>(serverSnippets);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add-form fields
  const [newLanguage, setNewLanguage] = useState('JavaScript');
  const [newLabel,    setNewLabel]    = useState('');
  const [newCode,     setNewCode]     = useState('');

  // Sync when server data changes
  useEffect(() => {
    setSnippets(serverSnippets);
  }, [serverSnippets]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDelete = (index: number) => {
    setSnippets((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSnippet = () => {
    const code = newCode.trim();
    if (!code) return;

    const snippet: CodeSnippet = {
      language: newLanguage,
      code,
      label: newLabel.trim() || undefined,
    };
    setSnippets((prev) => [...prev, snippet]);

    // Reset form
    setNewLanguage('JavaScript');
    setNewLabel('');
    setNewCode('');
    setShowAddForm(false);
  };

  const handleCancelAdd = () => {
    setNewLanguage('JavaScript');
    setNewLabel('');
    setNewCode('');
    setShowAddForm(false);
  };

  const handleSave = async () => {
    await onSave(snippets);
  };

  // ── Empty state (read-only, no snippets) ──────────────────────────────────

  if (!canEdit && snippets.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: c.surface.secondary }]}>
        <Ionicons name="code-slash-outline" size={40} color={c.text.muted} />
        <Text style={[styles.emptyText, { color: c.text.muted }]}>
          No code snippets added yet
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
      {/* Existing snippets */}
      {snippets.length > 0 ? (
        <View style={styles.snippetsList}>
          {snippets.map((snippet, index) => {
            const langColor = getLanguageColor(snippet.language);
            return (
              <View
                key={index}
                style={[
                  styles.snippetCard,
                  {
                    backgroundColor: c.surface.card,
                    borderColor: c.border.primary,
                  },
                ]}
              >
                {/* Language header row */}
                <View style={styles.snippetHeader}>
                  <View
                    style={[
                      styles.languageChip,
                      {
                        backgroundColor: `${langColor}18`,
                        borderColor: `${langColor}44`,
                      },
                    ]}
                  >
                    <Ionicons name="code-slash-outline" size={12} color={langColor} />
                    <Text style={[styles.languageText, { color: langColor }]}>
                      {snippet.language}
                    </Text>
                  </View>

                  {snippet.label ? (
                    <Text
                      style={[styles.snippetLabel, { color: c.text.secondary }]}
                      numberOfLines={1}
                    >
                      {snippet.label}
                    </Text>
                  ) : null}

                  {/* Delete button */}
                  {canEdit && (
                    <Pressable
                      onPress={() => handleDelete(index)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete snippet ${index + 1}`}
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

                {/* Code block */}
                <CodeBlock
                  content={snippet.code}
                  style={styles.codeBlock}
                />
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.noSnippetsHint, { borderColor: c.border.primary }]}>
          <Ionicons name="code-outline" size={20} color={c.text.muted} />
          <Text style={[styles.noSnippetsText, { color: c.text.muted }]}>
            No snippets yet — add one below
          </Text>
        </View>
      )}

      {/* Add snippet form — only shown when canEdit */}
      {canEdit && (
        <>
          {!showAddForm ? (
            /* "Add Snippet" trigger button */
            <Pressable
              onPress={() => setShowAddForm(true)}
              accessibilityRole="button"
              style={({ pressed }: { pressed: boolean }) => [
                styles.addTrigger,
                {
                  backgroundColor: pressed
                    ? `${c.interactive.primary}14`
                    : `${c.interactive.primary}08`,
                  borderColor: `${c.interactive.primary}44`,
                },
              ]}
            >
              <Ionicons name="add-circle-outline" size={18} color={c.interactive.primary} />
              <Text style={[styles.addTriggerText, { color: c.interactive.primary }]}>
                Add Code Snippet
              </Text>
            </Pressable>
          ) : (
            /* Inline add form */
            <View
              style={[
                styles.addForm,
                {
                  backgroundColor: c.surface.secondary,
                  borderColor: c.border.primary,
                },
              ]}
            >
              <Text style={[styles.addFormTitle, { color: c.text.primary }]}>
                New Code Snippet
              </Text>

              {/* Language selector — horizontal scrollable chips */}
              <Text style={[styles.fieldLabel, { color: c.text.secondary }]}>
                Language
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.languageScroll}
                contentContainerStyle={styles.languageScrollContent}
              >
                {LANGUAGES.map((lang) => {
                  const isSelected = newLanguage === lang;
                  const langColor  = getLanguageColor(lang);
                  return (
                    <Pressable
                      key={lang}
                      onPress={() => setNewLanguage(lang)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      style={[
                        styles.langChipOption,
                        {
                          backgroundColor: isSelected
                            ? `${langColor}22`
                            : c.surface.elevated,
                          borderColor: isSelected
                            ? langColor
                            : c.border.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.langChipText,
                          {
                            color: isSelected ? langColor : c.text.secondary,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          },
                        ]}
                      >
                        {lang}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Label field */}
              <AppTextInput
                label="Label (optional)"
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="e.g. Fix function, API call..."
                maxLength={100}
                showClearButton
                onClear={() => setNewLabel('')}
                containerStyle={styles.formField}
              />

              {/* Code field */}
              <AppTextInput
                label="Code *"
                value={newCode}
                onChangeText={setNewCode}
                placeholder="Paste or type your code here..."
                multiline
                numberOfLines={8}
                maxLength={10000}
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.formField}
              />

              {/* Add / Cancel buttons */}
              <View style={styles.addFormActions}>
                <AppButton
                  variant="outline"
                  size="small"
                  onPress={handleCancelAdd}
                  style={styles.cancelButton}
                >
                  Cancel
                </AppButton>
                <AppButton
                  variant="primary"
                  size="small"
                  onPress={handleAddSnippet}
                  disabled={!newCode.trim()}
                  leftIcon={
                    <Ionicons name="add-circle-outline" size={14} color="#fff" />
                  }
                  style={styles.addConfirmButton}
                >
                  Add Snippet
                </AppButton>
              </View>
            </View>
          )}

          {/* Save button */}
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
            Save Snippets
          </AppButton>
        </>
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
  snippetsList: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  snippetCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  snippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  languageText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  snippetLabel: {
    flex: 1,
    fontSize: FontSize.sm,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBlock: {
    margin: Spacing.sm,
    marginTop: 0,
    borderRadius: Radius.lg,
  },
  noSnippetsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noSnippetsText: {
    fontSize: FontSize.sm,
  },
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  addTriggerText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  addForm: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  addFormTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  languageScroll: {
    marginBottom: Spacing.md,
  },
  languageScrollContent: {
    gap: Spacing.sm,
    paddingEnd: Spacing.sm,
  },
  langChipOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  langChipText: {
    fontSize: FontSize.xs,
  },
  formField: {
    marginBottom: Spacing.sm,
  },
  addFormActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    marginTop: Spacing.sm,
  },
  cancelButton: {
    minWidth: 80,
  },
  addConfirmButton: {
    minWidth: 120,
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

export default CodeSnippetsSection;
