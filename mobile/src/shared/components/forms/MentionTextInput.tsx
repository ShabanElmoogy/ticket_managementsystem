/**
 * MentionTextInput — @name mention-aware text input with suggestion list overlay.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. CommentsTab.tsx — comment input with @mention support
 * 2. TicketCard.tsx  — inline comment input in the feed card
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BEHAVIOR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - Detects `@` prefix in the current word being typed
 * - Shows a suggestion list overlay filtered by the typed prefix
 * - Tapping a suggestion inserts `@name ` at the cursor position
 * - Pressing the send button or Enter (via `onSubmit`) submits the comment
 * - Disabled state shows a read-only placeholder (e.g. "Subscription ended")
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * <MentionTextInput
 *   value={commentText}
 *   onChange={setCommentText}
 *   onSubmit={handleSubmitComment}
 *   users={ticketUsers}
 *   placeholder="Write a comment... use @ to mention someone"
 *   resolvedColors={c}
 * />
 *
 * // Disabled (suspended tenant)
 * <MentionTextInput
 *   value=""
 *   onChange={() => {}}
 *   onSubmit={() => {}}
 *   users={[]}
 *   placeholder="Subscription ended — read only"
 *   disabled
 *   resolvedColors={c}
 * />
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing } from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MentionUser {
  id: string;
  name: string;
}

/** Imperative handle exposed via forwardRef. */
export interface MentionTextInputHandle {
  /** Focuses the underlying TextInput. */
  focus: () => void;
}

export interface MentionTextInputProps {
  /** Current text value. */
  value: string;
  /** Called when the text changes. */
  onChange: (text: string) => void;
  /** Called when the user submits (send button or Enter). */
  onSubmit: () => void;
  /** List of users available for @mention suggestions. */
  users: MentionUser[];
  /** Placeholder text shown when empty. */
  placeholder?: string;
  /** Disables the input and send button. */
  disabled?: boolean;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** Extra style merged onto the root container. */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the @mention prefix being typed at the current cursor position.
 * Returns the partial name after `@` if the cursor is inside a mention word,
 * or null if not currently typing a mention.
 */
function getMentionQuery(text: string, cursorPos: number): string | null {
  const textBeforeCursor = text.slice(0, cursorPos);
  // Find the last @ before the cursor
  const atIndex = textBeforeCursor.lastIndexOf('@');
  if (atIndex === -1) return null;

  // Check there's no space between @ and cursor (still typing the mention)
  const wordAfterAt = textBeforeCursor.slice(atIndex + 1);
  if (/\s/.test(wordAfterAt)) return null;

  return wordAfterAt.toLowerCase();
}

/**
 * Replaces the current @mention word with the selected user's name.
 */
function insertMention(text: string, cursorPos: number, userName: string): string {
  const textBeforeCursor = text.slice(0, cursorPos);
  const atIndex = textBeforeCursor.lastIndexOf('@');
  if (atIndex === -1) return text;

  const before = text.slice(0, atIndex);
  const after = text.slice(cursorPos);
  return `${before}@${userName} ${after}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const MentionTextInput = forwardRef<MentionTextInputHandle, MentionTextInputProps>(({
  value,
  onChange,
  onSubmit,
  users,
  placeholder = 'Write a comment... use @ to mention someone',
  disabled = false,
  resolvedColors: c,
  style,
}, ref) => {
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<any>(null);

  // Expose focus() to parent via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  // Derive mention query from current cursor position
  const mentionQuery = getMentionQuery(value, cursorPos);

  // Filter users by the typed prefix
  const suggestions =
    mentionQuery !== null
      ? users.filter((u) =>
        u.name.toLowerCase().startsWith(mentionQuery) ||
        u.name.toLowerCase().includes(mentionQuery)
      ).slice(0, 6)
      : [];

  const handleSelectionChange = useCallback(
    (e: any) => {
      setCursorPos(e.nativeEvent.selection.end);
    },
    []
  );

  const handleSelectUser = useCallback(
    (user: MentionUser) => {
      const newText = insertMention(value, cursorPos, user.name);
      onChange(newText);
      // Move cursor after the inserted mention
      const atIndex = value.slice(0, cursorPos).lastIndexOf('@');
      const newCursorPos = atIndex + user.name.length + 2; // +2 for @ and space
      setCursorPos(newCursorPos);
      // Refocus input
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [value, cursorPos, onChange]
  );

  const handleSubmit = useCallback(() => {
    if (!disabled && value.trim()) {
      onSubmit();
    }
  }, [disabled, value, onSubmit]);

  const canSend = !disabled && value.trim().length > 0;

  return (
    <View style={[styles.wrapper, style]}>
      {/* Suggestion list — shown above the input when typing @mention */}
      {suggestions.length > 0 && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: c.surface.card,
              borderColor: c.border.primary,
              shadowColor: c.shadow,
            },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="always"
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleSelectUser(item)}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.suggestionItem,
                  { backgroundColor: pressed ? c.interactive.pressed : 'transparent' },
                ]}
              >
                <View style={[styles.suggestionAvatar, { backgroundColor: `${c.interactive.primary}22` }]}>
                  <Text style={[styles.suggestionAvatarText, { color: c.interactive.primary }]}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.suggestionName, { color: c.text.primary }]}>
                  {item.name}
                </Text>
                <Text style={[styles.suggestionAt, { color: c.text.muted }]}>
                  @{item.name.toLowerCase().replace(/\s+/g, '')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/*
        Input row — force direction: 'ltr' so the send button is ALWAYS on the
        right regardless of the app language (RTL/LTR). The TextInput itself
        handles its own writing direction separately.
      */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: disabled ? c.surface.secondary : c.surface.card,
            borderColor: c.border.primary,
            shadowColor: c.shadow,
            // Force LTR so button never flips to the left in Arabic
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          onSelectionChange={handleSelectionChange}
          placeholder={placeholder}
          placeholderTextColor={c.text.muted}
          multiline
          editable={!disabled}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSubmit}
          style={[
            styles.input,
            {
              color: disabled ? c.text.muted : c.text.primary,
            },
          ]}
          accessibilityLabel="Comment input"
          accessibilityHint="Type @ to mention someone"
        />

        {/* Send button — always visible on the right, dimmed when empty */}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send comment"
          style={({ pressed }: { pressed: boolean }) => [
            styles.sendButton,
            {
              backgroundColor: canSend
                ? pressed
                  ? c.interactive.primaryPressed
                  : c.interactive.primary
                : `${c.interactive.primary}30`,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              alignSelf: 'center'
            },
          ]}
        >
          <Ionicons
            name="send"
            size={16}
            color={canSend ? c.text.primary : c.interactive.primary}
            style={{ marginLeft: 2, alignSelf: 'center' }}
          />
        </Pressable>
      </View>
    </View>
  );
});

MentionTextInput.displayName = 'MentionTextInput';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  suggestionsContainer: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: 8,
    maxHeight: 240,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  suggestionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  suggestionAvatarText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  suggestionName: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  suggestionAt: {
    fontSize: FontSize.xs,
    opacity: 0.7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius['2xl'],
    borderWidth: 1.5,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    maxHeight: 100,
    minHeight: 36,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    lineHeight: 20,
    // No textAlign/writingDirection here — direction:'ltr' on the row handles it
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    // Sits at flex-end (bottom of row) — no extra margin needed
  },
});

export default MentionTextInput;
