/**
 * CommentsTab — Comments tab in the Ticket Detail screen.
 *
 * Shows MentionTextInput at top, then a FlatList of comments with
 * author avatar, name, timestamp, content with @mention highlighting,
 * and delete button for own comments or admin.
 *
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native') as any;
const FlatList = RN.FlatList as any;
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import { useDirection } from '@/src/providers/DirectionProvider';
import MentionTextInput from '@/src/shared/components/forms/MentionTextInput';
import InitialAvatar from '@/src/shared/components/display/InitialAvatar';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Comment } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

/**
 * Renders comment content with @mention tokens highlighted.
 */
const MentionContent: React.FC<{
  content: string;
  primaryColor: string;
  textColor: string;
}> = ({ content, primaryColor, textColor }) => {
  const words = content.split(' ');
  return (
    <Text>
      {words.map((word, i) => {
        const isMention = word.startsWith('@') && word.length > 1;
        return (
          <Text
            key={i}
            style={{
              color: isMention ? primaryColor : textColor,
              fontWeight: isMention ? FontWeight.semibold : FontWeight.normal,
            }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </Text>
        );
      })}
    </Text>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface CommentsTabProps {
  ticketId: string;
  comments: Comment[];
  resolvedColors: ThemeColors;
  currentUserId: string;
  isAdmin: boolean;
  tenantSuspended: boolean;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => void;
  isAddingComment: boolean;
  mentionUsers: { id: string; name: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const CommentsTab: React.FC<CommentsTabProps> = ({
  comments,
  resolvedColors: c,
  currentUserId,
  isAdmin,
  tenantSuspended,
  onAddComment,
  onDeleteComment,
  isAddingComment,
  mentionUsers,
}) => {
  const { isRtl } = useDirection();
  const [commentText, setCommentText] = React.useState('');

  const handleSubmit = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    try {
      await onAddComment(trimmed);
      setCommentText('');
    } catch {
      // NetworkErrorDialog handles
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const canDelete = isAdmin || item.userId === currentUserId;
    return (
      <View
        style={[
          styles.commentItem,
          {
            backgroundColor: c.surface.card,
            borderColor: c.border.primary,
          },
        ]}
      >
        {/* Header row */}
        <View style={[styles.commentHeader, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <InitialAvatar name={item.user?.name ?? '?'} size={28} />
          <View style={styles.commentMeta}>
            <Text
              style={[
                styles.authorName,
                { color: c.text.primary, textAlign: isRtl ? 'right' : 'left' },
              ]}
            >
              {item.user?.name ?? 'Unknown'}
            </Text>
            <Text style={[styles.timestamp, { color: c.text.muted }]}>
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>
          {canDelete && (
            <Pressable
              onPress={() => onDeleteComment(item.id)}
              accessibilityRole="button"
              accessibilityLabel="Delete comment"
              style={({ pressed }: { pressed: boolean }) => [
                styles.deleteButton,
                {
                  backgroundColor: pressed ? c.intent.errorSurface : 'transparent',
                },
              ]}
            >
              <Ionicons name="trash-outline" size={14} color={c.intent.error} />
            </Pressable>
          )}
        </View>

        {/* Content */}
        <View style={styles.commentContent}>
          <MentionContent
            content={item.content}
            primaryColor={c.interactive.primary}
            textColor={c.text.primary}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.surface.primary }]}>
      {/* Input area at top */}
      <View
        style={[
          styles.inputSection,
          {
            backgroundColor: c.surface.card,
            borderBottomColor: c.border.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.inputLabel,
            { color: c.text.secondary, textAlign: isRtl ? 'right' : 'left' },
          ]}
        >
          Comment →
        </Text>
        <MentionTextInput
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSubmit}
          users={mentionUsers}
          placeholder={
            tenantSuspended
              ? 'Subscription ended — read only'
              : 'Write a comment... use @ to mention someone'
          }
          disabled={tenantSuspended || isAddingComment}
          resolvedColors={c}
        />
      </View>

      {/* Comment list */}
      <FlatList
        data={comments}
        keyExtractor={(item: Comment) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={40} color={c.text.muted} />
            <Text style={[styles.emptyText, { color: c.text.muted }]}>No comments yet</Text>
          </View>
        }
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputSection: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  listContent: {
    padding: Spacing.md,
    gap: 8,
    paddingBottom: 32,
  },
  commentItem: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: 8,
    gap: 8,
  },
  commentHeader: {
    alignItems: 'center',
    gap: 8,
  },
  commentMeta: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  timestamp: {
    fontSize: FontSize.xs,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentContent: {
    paddingStart: 36,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: FontSize.sm,
  },
});

export default CommentsTab;
