/**
 * TicketCardComments — inline expandable comment section for a social-post ticket card.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────────────────╮
 * │  [JD] John Doe  •  2h ago                                           │
 * │       Great catch! @alice can you look into this?              [🗑]  │
 * │                                                                      │
 * │  [AB] Alice Brown  •  1h ago                                        │
 * │       Sure, I'll check it out.                                 [🗑]  │
 * │                                                                      │
 * │  ▼ See 3 more comments                                              │
 * │                                                                      │
 * │  ┌─────────────────────────────────────────────────────────────┐   │
 * │  │ Write a comment... use @ to mention someone          [Send] │   │
 * │  └─────────────────────────────────────────────────────────────┘   │
 * ╰──────────────────────────────────────────────────────────────────────╯
 *
 * Behavior:
 * - Auto-fetches comments when `_count.comments > 0` on mount
 * - Shows 3 most-recent comments initially
 * - "See X more" button loads 3 more at a time (with spinner)
 * - Each comment shows: avatar, author name, relative timestamp, content
 *   with @mention highlighting, and a delete button (own comments or admin)
 * - MentionTextInput at the bottom for adding new comments
 * - Disabled when `tenantSuspended` is true
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. TicketCard/index.tsx — inline comment section in the feed card
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing, Palette } from '@/src/constants/tokens';
import MentionTextInput from '@/src/shared/components/forms/MentionTextInput';
import { getInitials } from '@/src/shared/components/display/Avatar';
import { ticketsApi } from '@/src/features/tickets/api/tickets';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Comment } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Number of comments shown per page. */
const PAGE_SIZE = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable relative timestamp.
 * e.g. "just now", "5m ago", "2h ago", "3d ago"
 */
function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  if (diffMs < 60_000) return 'just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  if (diffMs < 604_800_000) return `${Math.floor(diffMs / 86_400_000)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Parses comment content and splits it into segments of plain text and @mentions.
 * Used to render @mention tokens with a highlighted color.
 */
function parseCommentSegments(
  content: string,
): Array<{ type: 'text' | 'mention'; value: string }> {
  const parts = content.split(/(@\w+)/g);
  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      type: /^@\w+$/.test(part) ? 'mention' : 'text',
      value: part,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface CommentContentProps {
  content: string;
  mentionColor: string;
  textColor: string;
}

/**
 * Renders comment text with @mention tokens highlighted in the accent color.
 */
const CommentContent: React.FC<CommentContentProps> = ({
  content,
  mentionColor,
  textColor,
}) => {
  const segments = parseCommentSegments(content);
  return (
    <Text style={[styles.commentText, { color: textColor }]}>
      {segments.map((seg, idx) =>
        seg.type === 'mention' ? (
          <Text
            key={idx}
            style={[
              styles.mentionToken,
              {
                color: mentionColor,
                backgroundColor: `${mentionColor}18`,
              },
            ]}
          >
            {seg.value}
          </Text>
        ) : (
          <Text key={idx}>{seg.value}</Text>
        )
      )}
    </Text>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCardCommentsProps {
  /** The ticket ID to fetch and post comments for. */
  ticketId: string;
  /** Total comment count from `ticket._count.comments`. Used to decide auto-fetch. */
  commentCount: number;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** The current authenticated user's ID (for delete permission check). */
  currentUserId: string;
  /** Whether the current user is a TENANT_ADMIN (can delete any comment). */
  isAdmin: boolean;
  /** When true, the comment input is disabled (subscription suspended). */
  tenantSuspended?: boolean;
  /**
   * List of users available for @mention suggestions.
   * Typically the ticket's assignee + creator + watchers.
   */
  mentionUsers?: Array<{ id: string; name: string }>;
  /**
   * Called after a comment is successfully added.
   * Parent can use this to update the ticket's `_count.comments`.
   */
  onCommentAdded?: () => void;
  /**
   * Called after a comment is successfully deleted.
   * Parent can use this to update the ticket's `_count.comments`.
   */
  onCommentDeleted?: () => void;
  /** Extra style merged onto the root container. */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketCardComments: React.FC<TicketCardCommentsProps> = ({
  ticketId,
  commentCount,
  resolvedColors: c,
  currentUserId,
  isAdmin,
  tenantSuspended = false,
  mentionUsers = [],
  onCommentAdded,
  onCommentDeleted,
  style,
}) => {
  // ── State ─────────────────────────────────────────────────────────────────
  const [allComments, setAllComments]     = useState<Comment[]>([]);
  const [visibleCount, setVisibleCount]   = useState(PAGE_SIZE);
  const [loading, setLoading]             = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const [commentText, setCommentText]     = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);

  // Track whether we've already fetched to avoid duplicate requests
  const hasFetched = useRef(false);

  // ── Auto-fetch on mount when there are comments ───────────────────────────
  useEffect(() => {
    if (commentCount > 0 && !hasFetched.current) {
      hasFetched.current = true;
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, commentCount]);

  // ── Fetch all comments ────────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ticketsApi.getComments(ticketId);
      // Sort newest-first so we show the most recent 3 at the bottom
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAllComments(sorted);
    } catch {
      // NetworkErrorDialog handles API errors automatically
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  // ── "See more" — load 3 more comments ────────────────────────────────────
  const handleSeeMore = useCallback(async () => {
    setLoadingMore(true);
    // Simulate a brief delay for UX (data is already loaded)
    await new Promise((resolve) => setTimeout(resolve, 200));
    setVisibleCount((prev) => prev + PAGE_SIZE);
    setLoadingMore(false);
  }, []);

  // ── Submit a new comment ──────────────────────────────────────────────────
  const handleSubmitComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || submitting || tenantSuspended) return;

    setSubmitting(true);
    try {
      const newComment = await ticketsApi.addComment(ticketId, trimmed);
      // Prepend to the list (newest first)
      setAllComments((prev) => [newComment, ...prev]);
      setCommentText('');
      onCommentAdded?.();
    } catch {
      // NetworkErrorDialog handles API errors automatically
    } finally {
      setSubmitting(false);
    }
  }, [commentText, submitting, tenantSuspended, ticketId, onCommentAdded]);

  // ── Delete a comment ──────────────────────────────────────────────────────
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      setDeletingId(commentId);
      try {
        await ticketsApi.deleteComment(ticketId, commentId);
        setAllComments((prev) => prev.filter((c) => c.id !== commentId));
        onCommentDeleted?.();
      } catch {
        // NetworkErrorDialog handles API errors automatically
      } finally {
        setDeletingId(null);
      }
    },
    [ticketId, onCommentDeleted]
  );

  // ── Derived values ────────────────────────────────────────────────────────

  // Comments are sorted newest-first; we show the first `visibleCount` entries
  // which are the most recent ones.
  const visibleComments = allComments.slice(0, visibleCount);
  const remainingCount = allComments.length - visibleCount;
  const hasMore = remainingCount > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: c.border.primary },
        style,
      ]}
    >
      {/* Loading skeleton */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={c.interactive.primary} />
          <Text style={[styles.loadingText, { color: c.text.muted }]}>
            Loading comments…
          </Text>
        </View>
      )}

      {/* Comment list — newest first, limited to visibleCount */}
      {!loading && visibleComments.length > 0 && (
        <View style={styles.commentList}>
          {visibleComments.map((comment) => {
            const canDelete =
              isAdmin || comment.userId === currentUserId;
            const isDeleting = deletingId === comment.id;
            const authorName = comment.user?.name ?? 'Unknown';
            const avatarColor = Palette.violet500;

            return (
              <View
                key={comment.id}
                style={[
                  styles.commentRow,
                  { opacity: isDeleting ? 0.5 : 1 },
                ]}
              >
                {/* Author avatar */}
                <View
                  style={[
                    styles.commentAvatar,
                    { backgroundColor: `${avatarColor}22` },
                  ]}
                  accessibilityRole="image"
                  accessibilityLabel={`${authorName} avatar`}
                >
                  <Text style={[styles.commentAvatarText, { color: avatarColor }]}>
                    {getInitials(authorName)}
                  </Text>
                </View>

                {/* Comment body */}
                <View style={styles.commentBody}>
                  {/* Author name + timestamp */}
                  <View style={styles.commentMeta}>
                    <Text
                      style={[styles.commentAuthor, { color: c.text.primary }]}
                      numberOfLines={1}
                    >
                      {authorName}
                    </Text>
                    <Text style={[styles.commentTimestamp, { color: c.text.muted }]}>
                      {' • '}
                      {formatRelativeTime(comment.createdAt)}
                    </Text>
                  </View>

                  {/* Comment content with @mention highlighting */}
                  <CommentContent
                    content={comment.content}
                    mentionColor={c.interactive.primary}
                    textColor={c.text.secondary}
                  />
                </View>

                {/* Delete button — own comments or admin only */}
                {canDelete && (
                  <Pressable
                    onPress={() => handleDeleteComment(comment.id)}
                    disabled={isDeleting}
                    accessibilityRole="button"
                    accessibilityLabel="Delete comment"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.deleteButton,
                      {
                        backgroundColor: pressed
                          ? `${c.intent.error}18`
                          : 'transparent',
                        opacity: isDeleting ? 0.4 : 1,
                      },
                    ]}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={c.intent.error} />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color={c.intent.error}
                      />
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Empty state — no comments yet (and not loading) */}
      {!loading && allComments.length === 0 && commentCount === 0 && (
        <View style={styles.emptyState}>
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={c.text.muted}
          />
          <Text style={[styles.emptyText, { color: c.text.muted }]}>
            No comments yet
          </Text>
        </View>
      )}

      {/* "See X more comments" button */}
      {hasMore && (
        <Pressable
          onPress={handleSeeMore}
          disabled={loadingMore}
          accessibilityRole="button"
          accessibilityLabel={`See ${remainingCount} more comments`}
          style={({ pressed }: { pressed: boolean }) => [
            styles.seeMoreButton,
            {
              backgroundColor: pressed
                ? c.surface.elevated
                : 'transparent',
            },
          ]}
        >
          {loadingMore ? (
            <ActivityIndicator size="small" color={c.interactive.primary} />
          ) : (
            <>
              <Ionicons
                name="chevron-down-outline"
                size={14}
                color={c.interactive.primary}
              />
              <Text style={[styles.seeMoreText, { color: c.interactive.primary }]}>
                See {remainingCount} more comment{remainingCount !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </Pressable>
      )}

      {/* Comment input */}
      <View style={styles.inputWrapper}>
        <MentionTextInput
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSubmitComment}
          users={mentionUsers}
          placeholder={
            tenantSuspended
              ? 'Subscription ended — read only'
              : 'Write a comment... use @ to mention someone'
          }
          disabled={tenantSuspended || submitting}
          resolvedColors={c}
        />
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.sm,
  },
  commentList: {
    gap: Spacing.sm,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  commentAvatarText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  commentAuthor: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    lineHeight: 16,
  },
  commentTimestamp: {
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  commentText: {
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  mentionToken: {
    fontWeight: FontWeight.semibold,
    borderRadius: Radius.sm,
    paddingHorizontal: 2,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  seeMoreText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  inputWrapper: {
    paddingTop: Spacing.xs,
  },
});

export default TicketCardComments;
