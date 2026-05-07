/**
 * TicketCommentsModal — full-screen comments modal, Facebook-style.
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, FontSize, FontWeight, Spacing, Palette } from '@/src/constants/tokens';
import { getInitials } from '@/src/shared/components/display/Avatar';
import { ticketsApi } from '@/src/features/tickets/api/tickets';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Comment } from '@/src/services/api/types/ticket';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000)      return 'just now';
  if (diff < 3_600_000)   return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)  return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function parseSegments(content: string) {
  return content.split(/(@\w+)/g).filter(Boolean).map((p) => ({
    type: /^@\w+$/.test(p) ? 'mention' : 'text',
    value: p,
  }));
}

function avatarColor(str: string): string {
  const COLORS = [
    Palette.violet500, Palette.blue500, Palette.emerald500,
    Palette.amber500, Palette.rose500, Palette.teal500,
    Palette.indigo500, Palette.cyan500,
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketCommentsModalProps {
  visible: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
  commentCount: number;
  resolvedColors: ThemeColors;
  currentUserId: string;
  isAdmin: boolean;
  tenantSuspended?: boolean;
  mentionUsers?: Array<{ id: string; name: string }>;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketCommentsModal: React.FC<TicketCommentsModalProps> = ({
  visible,
  onClose,
  ticketId,
  ticketTitle,
  resolvedColors: c,
  currentUserId,
  isAdmin,
  tenantSuspended = false,
  mentionUsers = [],
  onCommentAdded,
  onCommentDeleted,
}) => {
  const [comments,   setComments]   = useState<Comment[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [text,       setText]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const scrollRef    = useRef<ScrollView>(null);
  const inputRef     = useRef<TextInput>(null);
  const ticketIdRef  = useRef(ticketId);
  useEffect(() => { ticketIdRef.current = ticketId; }, [ticketId]);

  // ── Fetch on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    setText('');
    setComments([]);
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await ticketsApi.getComments(ticketIdRef.current);
        if (cancelled) return;
        setComments(
          [...data].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        );
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 150);
      } catch {
        // NetworkErrorDialog handles automatically
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [visible]); // only re-run when modal opens/closes

  // ── Focus handling ───────────────────────────────────────────────────────
  const handleShow = useCallback(() => {
    // Focus after the modal transition finishes
    setTimeout(() => {
      inputRef.current?.focus();
    }, Platform.OS === 'ios' ? 100 : 200);
  }, []);

  // ── Scroll up when keyboard shows ─────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    const ev = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(ev, () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => sub.remove();
  }, [visible]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting || tenantSuspended) return;
    setSubmitting(true);
    try {
      const newComment = await ticketsApi.addComment(ticketId, trimmed);
      setComments((prev) => [...prev, newComment]);
      setText('');
      onCommentAdded?.();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // NetworkErrorDialog handles automatically
    } finally {
      setSubmitting(false);
    }
  }, [text, submitting, tenantSuspended, ticketId, onCommentAdded]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (commentId: string) => {
    setDeletingId(commentId);
    try {
      await ticketsApi.deleteComment(ticketId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentDeleted?.();
    } catch {
      // NetworkErrorDialog handles automatically
    } finally {
      setDeletingId(null);
    }
  }, [ticketId, onCommentDeleted]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      {/*
        Outer View fills the modal sheet.
        direction:'ltr' — Modal is outside DirectionProvider.
      */}
      <View style={[styles.sheet, { backgroundColor: c.surface.primary, direction: 'ltr' }]}>
        <SafeAreaView style={styles.safeArea}>

          {/* ── Header ────────────────────────────────────────────────── */}
          <View style={[styles.header, { borderBottomColor: c.border.primary }]}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={24} color={c.text.primary} />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: c.text.primary }]} numberOfLines={1}>
                Comments
              </Text>
              <Text style={[styles.headerSub, { color: c.text.muted }]} numberOfLines={1}>
                {ticketTitle}
              </Text>
            </View>
            {/* balance spacer */}
            <View style={styles.closeBtn} />
          </View>

          {/*
            KeyboardAvoidingView shrinks the area between header and bottom.
            The ScrollView grows to fill it; the inputBar sits below.
          */}
          <KeyboardAvoidingView
            style={styles.kav}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          >
            {/* ── Comment list ────────────────────────────────────────── */}
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                comments.length === 0 && !loading && styles.scrollContentEmpty,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Loading */}
              {loading && (
                <View style={styles.centered}>
                  <ActivityIndicator color={c.interactive.primary} />
                  <Text style={[styles.loadingText, { color: c.text.muted }]}>
                    Loading comments…
                  </Text>
                </View>
              )}

              {/* Empty */}
              {!loading && comments.length === 0 && (
                <View style={styles.centered}>
                  <Ionicons name="chatbubble-outline" size={44} color={c.text.muted} />
                  <Text style={[styles.emptyTitle, { color: c.text.secondary }]}>
                    No comments yet
                  </Text>
                  <Text style={[styles.emptySub, { color: c.text.muted }]}>
                    Be the first to comment
                  </Text>
                </View>
              )}

              {/* Comments */}
              {!loading && comments.map((comment) => {
                const color     = avatarColor(comment.user?.name ?? '');
                const canDelete = isAdmin || comment.userId === currentUserId;
                const deleting  = deletingId === comment.id;

                return (
                  <View key={comment.id} style={[styles.row, { opacity: deleting ? 0.5 : 1 }]}>
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: color }]}>
                      <Text style={styles.avatarText}>
                        {getInitials(comment.user?.name ?? '?')}
                      </Text>
                    </View>

                    {/* Bubble + delete */}
                    <View style={styles.bubbleCol}>
                      <View style={[styles.bubble, { backgroundColor: c.surface.secondary }]}>
                        <View style={styles.bubbleMeta}>
                          <Text style={[styles.author, { color }]} numberOfLines={1}>
                            {comment.user?.name ?? 'Unknown'}
                          </Text>
                          <Text style={[styles.ts, { color: c.text.muted }]}>
                            {formatRelativeTime(comment.createdAt)}
                          </Text>
                        </View>
                        <Text style={[styles.commentText, { color: c.text.primary }]}>
                          {parseSegments(comment.content).map((seg, i) =>
                            seg.type === 'mention' ? (
                              <Text
                                key={i}
                                style={{
                                  color: c.interactive.primary,
                                  backgroundColor: `${c.interactive.primary}18`,
                                  fontWeight: FontWeight.semibold,
                                }}
                              >
                                {seg.value}
                              </Text>
                            ) : (
                              <Text key={i}>{seg.value}</Text>
                            )
                          )}
                        </Text>
                      </View>

                      {canDelete && (
                        <Pressable
                          onPress={() => handleDelete(comment.id)}
                          disabled={deleting}
                          hitSlop={6}
                          style={styles.deleteBtn}
                        >
                          {deleting
                            ? <ActivityIndicator size="small" color={c.intent.error} />
                            : <Text style={[styles.deleteTxt, { color: c.text.muted }]}>Delete</Text>
                          }
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* ── Input bar ───────────────────────────────────────────── */}
            <View
              style={[
                styles.inputBar,
                { borderTopColor: c.border.primary, backgroundColor: c.surface.primary },
              ]}
            >
              <View style={[styles.inputRow, { backgroundColor: c.surface.secondary, borderColor: c.border.primary }]}>
                <TextInput
                  ref={inputRef}
                  value={text}
                  onChangeText={setText}
                  placeholder={tenantSuspended ? 'Subscription ended — read only' : 'Write a comment...'}
                  placeholderTextColor={c.text.muted}
                  style={[styles.textInput, { color: c.text.primary }]}
                  multiline
                  editable={!tenantSuspended && !submitting}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                />
                <Pressable
                  onPress={handleSubmit}
                  disabled={!text.trim() || submitting || tenantSuspended}
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: text.trim()
                        ? c.interactive.primary
                        : `${c.interactive.primary}30`,
                    },
                  ]}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="send" size={18} color={text.trim() ? '#fff' : c.interactive.primary} style={{ marginLeft: 2 }} />
                  }
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>

        </SafeAreaView>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Shell ──────────────────────────────────────────────────────────────────
  sheet: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width:          40,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex:       1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
  },
  headerSub: {
    fontSize:  FontSize.xs,
    marginTop: 1,
  },

  // ── Body ───────────────────────────────────────────────────────────────────
  // KeyboardAvoidingView fills everything below the header.
  // It uses column layout: ScrollView grows, inputBar stays at natural height.
  kav: {
    flex:          1,
    flexDirection: 'column',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.sm,
    gap:               Spacing.md,
  },
  scrollContentEmpty: {
    flexGrow:       1,
    justifyContent: 'center',
  },

  // ── Loading / Empty ────────────────────────────────────────────────────────
  centered: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.sm,
    paddingVertical: Spacing['3xl'],
  },
  loadingText: {
    fontSize: FontSize.sm,
  },
  emptyTitle: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  emptySub: {
    fontSize: FontSize.sm,
  },

  // ── Comment row ────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing.sm,
  },
  avatar: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    marginTop:      2,
  },
  avatarText: {
    fontSize:   11,
    fontWeight: FontWeight.bold,
    color:      '#fff',
  },
  bubbleCol: {
    flex: 1,
  },
  bubble: {
    paddingHorizontal:   Spacing.md,
    paddingVertical:     Spacing.sm,
    borderRadius:        Radius.xl,
    borderTopLeftRadius: Radius.xs,
    gap:                 3,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  2,
  },
  author: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  ts: {
    fontSize: 10,
    opacity:  0.7,
  },
  commentText: {
    fontSize:   FontSize.sm,
    lineHeight: 20,
  },
  deleteBtn: {
    alignSelf:  'flex-start',
    marginTop:  4,
    marginLeft: Spacing.sm,
  },
  deleteTxt: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // ── Input bar ──────────────────────────────────────────────────────────────
  inputBar: {
    paddingHorizontal: Spacing.md,
    paddingTop:        Spacing.sm,
    paddingBottom:     Spacing.md,
    borderTopWidth:    1,
  },
  inputRow: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   Radius['2xl'],
    borderWidth:    1.5,
    paddingLeft:    Spacing.md,
    paddingRight:   Spacing.xs,
    paddingVertical: Spacing.xs,
    gap:            8,
  },
  textInput: {
    flex:          1,
    fontSize:      FontSize.sm,
    minHeight:     36,
    maxHeight:     100,
    paddingTop:    Spacing.sm,
    paddingBottom: Spacing.sm,
    lineHeight:    20,
  },
  sendBtn: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
});

export default TicketCommentsModal;
