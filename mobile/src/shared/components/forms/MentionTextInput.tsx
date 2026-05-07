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

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import type { TextInputProps } from 'react-native/Libraries/Components/TextInput/TextInput';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TextInput, FlatList } = require('react-native') as {
  TextInput: (props: TextInputProps & { ref?: any }) => React.ReactElement | null;
  FlatList: any;
};
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

const MentionTextInput: React.FC<MentionTextInputProps> = ({
  value,
  onChange,
  onSubmit,
  users,
  placeholder = 'Write a comment... use @ to mention someone',
  disabled = false,
  resolvedColors: c,
  style,
}) => {
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<any>(null);

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
          <FlatList
            data={suggestions}
            keyExtractor={(item: { id: string; name: string }) => item.id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }: { item: { id: string; name: string } }) => (
              <Pressable
                onPress={() => handleSelectUser(item)}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.suggestionItem,
                  {
                    backgroundColor: pressed
                      ? c.interactive.pressed
                      : 'transparent',
                  },
                ]}
              >
                {/* Initials avatar */}
                <View
                  style={[
                    styles.suggestionAvatar,
                    { backgroundColor: `${c.interactive.primary}22` },
                  ]}
                >
                  <Text
                    style={[
                      styles.suggestionAvatarText,
                      { color: c.interactive.primary },
                    ]}
                  >
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
            )}
          />
        </View>
      )}

      {/* Input row */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: disabled ? c.surface.secondary : c.surface.card,
            borderColor: c.border.primary,
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
          style={[
            styles.input,
            {
              color: disabled ? c.text.muted : c.text.primary,
            },
          ]}
          accessibilityLabel="Comment input"
          accessibilityHint="Type @ to mention someone"
        />

        {/* Send button */}
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
                : c.interactive.disabled,
            },
          ]}
        >
          <Ionicons name="send" size={16} color={c.text.inverse} />
        </Pressable>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  suggestionsContainer: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 4,
    maxHeight: 200,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  suggestionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionAvatarText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  suggestionName: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  suggestionAt: {
    fontSize: FontSize.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingStart: Spacing.md,
    paddingEnd: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default MentionTextInput;
