/**
 * TicketActivityModal — full-screen activity feed modal.
 * Shows the activity timeline for a ticket in a slide-up sheet.
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, Palette, Radius } from '@/src/constants/tokens';
import { ticketsApi } from '@/src/features/tickets/api/tickets';
import type { ThemeColors } from '@/src/constants/tokens';
import type { TicketActivity } from '@/src/services/api/types/ticket';

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

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  CREATED:          { icon: 'add-circle-outline',      color: Palette.emerald500 },
  UPDATED:          { icon: 'create-outline',           color: Palette.blue500    },
  STATUS_CHANGED:   { icon: 'swap-horizontal-outline',  color: Palette.violet500  },
  ASSIGNED:         { icon: 'person-outline',           color: Palette.amber500   },
  COMMENTED:        { icon: 'chatbubble-outline',       color: Palette.cyan500    },
  COMMENT_DELETED:  { icon: 'trash-outline',            color: Palette.rose500    },
  DELETED:          { icon: 'trash-outline',            color: Palette.rose500    },
  RESTORED:         { icon: 'refresh-outline',          color: Palette.emerald500 },
  REASSIGNED:       { icon: 'people-outline',           color: Palette.amber500   },
  TAKEN:            { icon: 'checkmark-circle-outline', color: Palette.emerald500 },
  DUE_DATE_CHANGED: { icon: 'calendar-outline',         color: Palette.orange500  },
  PROGRAMMER_ASSIGNED: { icon: 'code-slash-outline',   color: Palette.indigo500  },
};

function getActionStyle(action: string) {
  return ACTION_ICONS[action] ?? { icon: 'ellipse-outline', color: Palette.zinc500 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface TicketActivityModalProps {
  visible: boolean;
  onClose: () => void;
  ticketId: string;
  ticketTitle: string;
  resolvedColors: ThemeColors;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TicketActivityModal: React.FC<TicketActivityModalProps> = ({
  visible,
  onClose,
  ticketId,
  ticketTitle,
  resolvedColors: c,
}) => {
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [loading,    setLoading]    = useState(false);

  const ticketIdRef = useRef(ticketId);
  useEffect(() => { ticketIdRef.current = ticketId; }, [ticketId]);

  useEffect(() => {
    if (!visible) return;
    setActivities([]);
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const data = await ticketsApi.getActivities(ticketIdRef.current);
        if (cancelled) return;
        setActivities(data);
      } catch {
        // NetworkErrorDialog handles automatically
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: c.surface.primary, direction: 'ltr' }]}>
        <SafeAreaView style={styles.safeArea}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <View style={[styles.header, { borderBottomColor: c.border.primary }]}>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={24} color={c.text.primary} />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: c.text.primary }]} numberOfLines={1}>
                Activity
              </Text>
              <Text style={[styles.headerSub, { color: c.text.muted }]} numberOfLines={1}>
                {ticketTitle}
              </Text>
            </View>
            <View style={styles.closeBtn} />
          </View>

          {/* ── Content ─────────────────────────────────────────────────── */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Loading */}
            {loading && (
              <View style={styles.centered}>
                <ActivityIndicator color={c.interactive.primary} />
                <Text style={[styles.loadingText, { color: c.text.muted }]}>
                  Loading activity…
                </Text>
              </View>
            )}

            {/* Empty */}
            {!loading && activities.length === 0 && (
              <View style={styles.centered}>
                <Ionicons name="pulse-outline" size={44} color={c.text.muted} />
                <Text style={[styles.emptyTitle, { color: c.text.secondary }]}>
                  No activity yet
                </Text>
              </View>
            )}

            {/* Timeline */}
            {!loading && activities.map((item, index) => {
              const { icon, color } = getActionStyle(item.action);
              const isLast = index === activities.length - 1;

              return (
                <View key={item.id} style={styles.row}>
                  {/* Timeline line + dot */}
                  <View style={styles.timelineCol}>
                    <View style={[styles.dot, { backgroundColor: color }]}>
                      <Ionicons name={icon as any} size={12} color="#fff" />
                    </View>
                    {!isLast && (
                      <View style={[styles.line, { backgroundColor: c.border.primary }]} />
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.content}>
                    <View style={styles.rowHeader}>
                      <Text style={[styles.actor, { color: c.text.primary }]} numberOfLines={1}>
                        {item.user?.name ?? 'System'}
                      </Text>
                      <Text style={[styles.time, { color: c.text.muted }]}>
                        {formatRelativeTime(item.createdAt)}
                      </Text>
                    </View>
                    <Text style={[styles.description, { color: c.text.secondary }]}>
                      {item.description}
                    </Text>
                    {(item.oldValue || item.newValue) && (
                      <View style={[styles.changeRow, { backgroundColor: c.surface.secondary }]}>
                        {item.oldValue && (
                          <Text style={[styles.changeText, { color: c.text.muted }]} numberOfLines={1}>
                            {item.oldValue}
                          </Text>
                        )}
                        {item.oldValue && item.newValue && (
                          <Ionicons name="arrow-forward-outline" size={12} color={c.text.muted} />
                        )}
                        {item.newValue && (
                          <Text style={[styles.changeText, { color: c.text.primary }]} numberOfLines={1}>
                            {item.newValue}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

        </SafeAreaView>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet:    { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  headerSub:    { fontSize: FontSize.xs, marginTop: 1 },

  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop:        Spacing.md,
    paddingBottom:     Spacing.xl,
  },

  centered: {
    alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing['3xl'],
  },
  loadingText: { fontSize: FontSize.sm },
  emptyTitle:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold },

  // Timeline
  row: {
    flexDirection: 'row',
    gap:           Spacing.md,
    marginBottom:  Spacing.sm,
  },
  timelineCol: {
    alignItems: 'center',
    width:      28,
  },
  dot: {
    width:          28,
    height:         28,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  line: {
    width:   2,
    flex:    1,
    marginTop: 4,
    minHeight: 16,
  },
  content: {
    flex:          1,
    paddingBottom: Spacing.md,
  },
  rowHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   2,
  },
  actor:       { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, flex: 1 },
  time:        { fontSize: FontSize.xs, opacity: 0.7 },
  description: { fontSize: FontSize.sm, lineHeight: 20 },
  changeRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    marginTop:         6,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:      Radius.md,
  },
  changeText: { fontSize: FontSize.xs, flex: 1 },
});

export default TicketActivityModal;
