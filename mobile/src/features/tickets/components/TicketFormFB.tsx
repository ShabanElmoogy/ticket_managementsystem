/**
 * TicketFormFB — Facebook "Create Post" inspired ticket form.
 *
 * Same Props interface as TicketForm.tsx — drop-in replacement.
 * Design: clean header with avatar, borderless inputs, bottom action bar
 * with expandable sections for priority, assignment, etc.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, Modal, StyleSheet,
  Animated, LayoutAnimation, UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import { Palette } from '@/src/constants/tokens';
import { useAuthStore } from '@/src/stores/authStore';
import { useUiStore } from '@/src/stores/uiStore';
import { useToast } from '@/src/shared/hooks/useToast';
import { useAuxData } from '@/src/shared/hooks/useAuxData';
import { networkEvents } from '@/src/services/api/networkEvents';
import Avatar from '@/src/shared/components/display/Avatar';
import ChipSelector from '@/src/shared/components/forms/ChipSelector';
import AppDatePicker from '@/src/shared/components/forms/AppDatePicker';
import { AlertDialog } from '@/src/shared/components/dialogs';
import { usersApi } from '@/src/features/admin/users/api/users';
import { customersApi } from '@/src/features/admin/customers/api/customers';
import { applicationsApi } from '@/src/features/admin/applications/api/applications';
import {
  createTicketFormSchema,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketFormValues,
} from '../schemas/ticketSchema';
import type { Ticket, CreateTicketData } from '@/src/services/api/types/ticket';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Priority / Status constants ───────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  LOW: Palette.emerald500, MEDIUM: Palette.amber500,
  HIGH: Palette.orange500, URGENT: Palette.red500,
};
const PRIORITY_OPTIONS = TICKET_PRIORITIES.map((p) => ({
  value: p, label: p.charAt(0) + p.slice(1).toLowerCase(), color: PRIORITY_COLORS[p],
}));

const STATUS_COLORS: Record<string, string> = {
  OPEN: Palette.amber500, IN_PROGRESS: Palette.blue500, PROGRAMMING: Palette.violet500,
  UNDER_DEVELOPMENT: Palette.indigo500, CODE_REVIEW: Palette.cyan500,
  TESTING: Palette.teal500, RESOLVED: Palette.emerald500, CLOSED: Palette.zinc500,
};
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In Progress', PROGRAMMING: 'Programming',
  UNDER_DEVELOPMENT: 'Under Development', CODE_REVIEW: 'Code Review',
  TESTING: 'Testing', RESOLVED: 'Resolved', CLOSED: 'Closed',
};
const STATUS_OPTIONS = TICKET_STATUSES.map((s) => ({
  value: s, label: STATUS_LABELS[s] ?? s, color: STATUS_COLORS[s],
}));

// ── Action bar item type ──────────────────────────────────────────────────────

type ActionId = 'priority' | 'status' | 'assign' | 'customer' | 'app' | 'schedule';

interface ActionItem {
  id: ActionId;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  editOnly?: boolean;
}

// ── Props (same as TicketForm) ────────────────────────────────────────────────

interface Props {
  item:       Ticket | null;
  onClose:    () => void;
  onSave:     (data: CreateTicketData) => Promise<void>;
  submitting: boolean;
  mode?:      'page' | 'modal';
}

// ── Component ─────────────────────────────────────────────────────────────────

const TicketFormFB: React.FC<Props> = ({ item, onClose, onSave, submitting, mode = 'page' }) => {
  const { t }    = useTranslation();
  const c        = useThemeColors();
  const toast    = useToast();
  const insets   = useSafeAreaInsets();
  const isRtl    = useUiStore((s) => s.direction) === 'rtl';
  const isEdit   = item != null;
  const user     = useAuthStore((s) => s.user);
  const userName = user?.name ?? 'User';

  // ── Expanded action panel ───────────────────────────────────────────────────
  const [expandedAction, setExpandedAction] = useState<ActionId | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  const toggleAction = useCallback((id: ActionId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedAction((prev) => (prev === id ? null : id));
  }, []);

  // ── Duplicate detection ─────────────────────────────────────────────────────
  const isDuplicateError = useRef(false);
  useEffect(() => {
    const unsub = networkEvents.onOkPress(() => {
      if (isDuplicateError.current) { isDuplicateError.current = false; onClose(); }
    });
    return () => { unsub(); };
  }, [onClose]);

  // ── Auxiliary data ──────────────────────────────────────────────────────────
  const { data: employees = [] }    = useAuxData(['ticket-form-employees'], () => usersApi.getEmployees());
  const { data: customers = [] }    = useAuxData(['ticket-form-customers'], () => customersApi.getCustomers());
  const { data: applications = [] } = useAuxData(['ticket-form-applications'], () => applicationsApi.getApplications());

  // ── RHF setup ───────────────────────────────────────────────────────────────
  const toDateStr = (v: unknown): string => {
    if (!v) return '';
    const d = v instanceof Date ? v : new Date(v as string);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(createTicketFormSchema(t, isEdit)) as any,
    mode: 'onBlur',
    defaultValues: {
      title: item?.title ?? '', description: item?.description ?? '',
      priority: item?.priority ?? 'MEDIUM', status: item?.status ?? undefined,
      assignedToId: item?.assignedToId ?? null, customerId: item?.customerId ?? null,
      applicationId: item?.applicationId ?? null, dueDate: toDateStr(item?.dueDate),
      estimatedHours: item?.estimatedHours ?? null,
    },
  });

  const { control, handleSubmit, formState: { isSubmitting, errors, isDirty }, watch } = form;
  const currentPriority = watch('priority');

  // ── Submit ──────────────────────────────────────────────────────────────────
  const doSave = async (data: TicketFormValues) => {
    try {
      await onSave({
        title: data.title, description: data.description, priority: data.priority,
        status: data.status, assignedToId: data.assignedToId ?? undefined,
        customerId: data.customerId ?? undefined, applicationId: data.applicationId ?? undefined,
        dueDate: data.dueDate ? data.dueDate : undefined, estimatedHours: data.estimatedHours ?? undefined,
      } as CreateTicketData);
      toast.success(isEdit ? t('tickets.messages.updated') : t('tickets.messages.created'));
      onClose();
    } catch (err: any) {
      const serverMsg: string = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';
      if (serverMsg.toLowerCase().includes('already exists')) {
        isDuplicateError.current = true;
        toast.error(t('tickets.duplicateError.title'), t('tickets.duplicateError.message'));
      }
    }
  };

  const isDisabled = submitting || isSubmitting;
  const formTitle  = isEdit ? t('tickets.editTitle') : t('tickets.addTitle');

  const handleBack = useCallback(() => {
    if (isDirty) { setShowDiscard(true); return; }
    onClose();
  }, [isDirty, onClose]);

  // ── Selector options ────────────────────────────────────────────────────────
  const employeeOpts    = employees.map((u) => ({ value: u.id, label: u.name }));
  const customerOpts    = customers.map((c) => ({ value: c.id, label: c.name }));
  const applicationOpts = applications.map((a) => ({ value: a.id, label: a.name }));

  // ── Action items ────────────────────────────────────────────────────────────
  const actions: ActionItem[] = [
    { id: 'priority', icon: 'flame-outline',          label: t('tickets.form.priority'),    color: Palette.orange500 },
    ...(isEdit ? [{ id: 'status' as ActionId, icon: 'sync-outline' as any, label: t('tickets.form.status'), color: Palette.blue500, editOnly: true }] : []),
    { id: 'assign',   icon: 'person-add-outline',     label: t('tickets.form.assignedTo'),  color: Palette.violet500 },
    { id: 'customer', icon: 'people-outline',          label: t('tickets.form.customer'),    color: Palette.emerald500 },
    { id: 'app',      icon: 'phone-portrait-outline',  label: t('tickets.form.application'), color: Palette.sky500 },
    { id: 'schedule', icon: 'calendar-outline',        label: t('tickets.form.dueDate'),     color: Palette.pink500 },
  ];

  // ── Priority badge color ────────────────────────────────────────────────────
  const priorityColor = PRIORITY_COLORS[currentPriority] ?? Palette.amber500;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal visible transparent={false} animationType="slide" onRequestClose={handleBack} statusBarTranslucent>
        <View style={[styles.root, { backgroundColor: c.surface.primary }]}>

          {/* ── FB-style Header ─────────────────────────────────────────────── */}
          <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: c.border.primary }]}>
            <Pressable onPress={handleBack} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.back')}>
              <Ionicons name="close" size={28} color={c.text.secondary} />
            </Pressable>

            <Text style={[styles.headerTitle, { color: c.text.primary }]} numberOfLines={1}>
              {formTitle}
            </Text>

            {/* Post / Save button */}
            <Pressable
              onPress={handleSubmit(doSave)}
              disabled={isDisabled}
              style={[
                styles.postBtn,
                { backgroundColor: isDisabled ? c.interactive.disabled : c.interactive.primary },
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.postBtnText, { color: Palette.white }]}>
                {submitting ? t('common.saving') : t('common.save')}
              </Text>
            </Pressable>
          </View>

          {/* ── Scrollable body ─────────────────────────────────────────────── */}
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* User info row (like FB "What's on your mind?") */}
              <View style={styles.userRow}>
                <Avatar text={userName} size={44} backgroundColor={c.interactive.primary} />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: c.text.primary }]}>{userName}</Text>
                  {/* Priority badge as "audience selector" */}
                  <Pressable
                    onPress={() => toggleAction('priority')}
                    style={[styles.audienceBadge, { backgroundColor: priorityColor + '18', borderColor: priorityColor + '40' }]}
                  >
                    <Ionicons name="flame" size={12} color={priorityColor} />
                    <Text style={[styles.audienceText, { color: priorityColor }]}>
                      {currentPriority.charAt(0) + currentPriority.slice(1).toLowerCase()}
                    </Text>
                    <Ionicons name="caret-down" size={10} color={priorityColor} />
                  </Pressable>
                </View>
              </View>

              {/* Title input — clean, borderless */}
              <Controller
                name="title"
                control={control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <View>
                    <TextInput
                      style={[styles.titleInput, { color: c.text.primary }]}
                      placeholder={t('tickets.form.titlePlaceholder')}
                      placeholderTextColor={c.text.muted}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      maxLength={120}
                      autoCapitalize="sentences"
                    />
                    {errors.title && (
                      <Text style={styles.errorText}>{errors.title.message as string}</Text>
                    )}
                  </View>
                )}
              />

              {/* Description — large borderless textarea */}
              <Controller
                name="description"
                control={control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <View>
                    <TextInput
                      style={[styles.descInput, { color: c.text.primary }]}
                      placeholder={t('tickets.form.descriptionPlaceholder')}
                      placeholderTextColor={c.text.muted}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                      maxLength={500}
                      textAlignVertical="top"
                      autoCapitalize="sentences"
                    />
                    {errors.description && (
                      <Text style={styles.errorText}>{errors.description.message as string}</Text>
                    )}
                  </View>
                )}
              />

              {/* ── Expanded action panels ────────────────────────────────────── */}
              {expandedAction === 'priority' && (
                <ActionPanel title={t('tickets.form.priority')} icon="flame-outline" color={Palette.orange500} c={c}>
                  <Controller name="priority" control={control}
                    render={({ field: { value, onChange } }) => (
                      <ChipSelector label="" options={PRIORITY_OPTIONS} value={value} onChange={onChange} />
                    )}
                  />
                </ActionPanel>
              )}

              {expandedAction === 'status' && isEdit && (
                <ActionPanel title={t('tickets.form.status')} icon="sync-outline" color={Palette.blue500} c={c}>
                  <Controller name="status" control={control}
                    render={({ field: { value, onChange } }) => (
                      <ChipSelector label="" options={STATUS_OPTIONS} value={value ?? null} onChange={onChange} />
                    )}
                  />
                </ActionPanel>
              )}

              {expandedAction === 'assign' && (
                <ActionPanel title={t('tickets.form.assignedTo')} icon="person-add-outline" color={Palette.violet500} c={c}>
                  <Controller name="assignedToId" control={control}
                    render={({ field: { value, onChange } }) => (
                      <ChipSelector label="" options={[
                        { value: null as any, label: t('tickets.form.unassigned') },
                        ...employeeOpts,
                      ]} value={value ?? null} onChange={onChange} />
                    )}
                  />
                </ActionPanel>
              )}

              {expandedAction === 'customer' && (
                <ActionPanel title={t('tickets.form.customer')} icon="people-outline" color={Palette.emerald500} c={c}>
                  <Controller name="customerId" control={control}
                    render={({ field: { value, onChange } }) => (
                      <ChipSelector label="" options={[
                        { value: null as any, label: t('tickets.form.noCustomer') },
                        ...customerOpts,
                      ]} value={value ?? null} onChange={onChange} />
                    )}
                  />
                </ActionPanel>
              )}

              {expandedAction === 'app' && (
                <ActionPanel title={t('tickets.form.application')} icon="phone-portrait-outline" color={Palette.sky500} c={c}>
                  <Controller name="applicationId" control={control}
                    render={({ field: { value, onChange } }) => (
                      <ChipSelector label="" options={[
                        { value: null as any, label: t('tickets.form.noApplication') },
                        ...applicationOpts,
                      ]} value={value ?? null} onChange={onChange} />
                    )}
                  />
                </ActionPanel>
              )}

              {expandedAction === 'schedule' && (
                <ActionPanel title={t('tickets.form.dueDate')} icon="calendar-outline" color={Palette.pink500} c={c}>
                  <Controller name="dueDate" control={control}
                    render={({ field: { value, onChange } }) => (
                      <AppDatePicker label="" value={value ?? ''} onChange={onChange}
                        placeholder={t('tickets.form.dueDatePlaceholder')} />
                    )}
                  />
                  <Controller name="estimatedHours" control={control}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <View style={styles.estRow}>
                        <Ionicons name="time-outline" size={16} color={c.text.muted} />
                        <TextInput
                          style={[styles.estInput, { color: c.text.primary, borderBottomColor: c.border.primary }]}
                          placeholder={t('tickets.form.estimatedHoursPlaceholder')}
                          placeholderTextColor={c.text.muted}
                          value={value != null ? String(value) : ''}
                          onChangeText={(txt) => {
                            const n = parseFloat(txt);
                            onChange(isNaN(n) ? null : n);
                          }}
                          onBlur={onBlur}
                          keyboardType="numeric"
                          maxLength={6}
                        />
                      </View>
                    )}
                  />
                </ActionPanel>
              )}

              {/* Edit-mode stats */}
              {isEdit && item && (
                <View style={[styles.statsRow, { borderTopColor: c.border.primary }]}>
                  <View style={[styles.statBadge, { backgroundColor: Palette.blue50 }]}>
                    <Ionicons name="chatbubble-outline" size={14} color={Palette.blue600} />
                    <Text style={[styles.statText, { color: Palette.blue700 }]}>
                      {item._count?.comments ?? 0} {t('tickets.columns.comments')}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* ── Bottom action bar (FB-style) ─────────────────────────────────── */}
            <View style={[styles.actionBar, {
              borderTopColor: c.border.primary,
              backgroundColor: c.surface.primary,
              paddingBottom: Math.max(insets.bottom, 8),
            }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionScroll}>
                {actions.map((action) => {
                  const isActive = expandedAction === action.id;
                  return (
                    <Pressable
                      key={action.id}
                      onPress={() => toggleAction(action.id)}
                      style={[
                        styles.actionItem,
                        isActive && { backgroundColor: action.color + '15', borderRadius: Radius.lg },
                      ]}
                    >
                      <Ionicons
                        name={isActive ? (action.icon.replace('-outline', '') as any) : action.icon}
                        size={22}
                        color={isActive ? action.color : c.text.muted}
                      />
                      <Text style={[
                        styles.actionLabel,
                        { color: isActive ? action.color : c.text.tertiary },
                      ]} numberOfLines={1}>
                        {action.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Discard confirmation */}
      <AlertDialog
        visible={showDiscard}
        onClose={() => setShowDiscard(false)}
        title={t('common.discardChanges')}
        message={t('common.discardChangesMessage')}
        icon="⚠️"
        accentColor={c.intent.warning}
        actions={[
          { label: t('common.discard'), onPress: () => { setShowDiscard(false); onClose(); }, variant: 'primary' },
          { label: t('common.keepEditing'), onPress: () => setShowDiscard(false), variant: 'cancel' },
        ]}
      />
    </>
  );
};

// ── Action Panel sub-component ────────────────────────────────────────────────

const ActionPanel: React.FC<{
  title: string; icon: string; color: string; c: any; children: React.ReactNode;
}> = ({ title, icon, color, c, children }) => (
  <View style={[styles.panel, { backgroundColor: color + '08', borderColor: color + '25' }]}>
    <View style={styles.panelHeader}>
      <View style={[styles.panelIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={[styles.panelTitle, { color: c.text.primary }]}>{title}</Text>
    </View>
    {children}
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, gap: 12,
  },
  headerTitle: {
    flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'center',
  },
  postBtn: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radius.lg,
  },
  postBtnText: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 0.3,
  },

  // User row
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  audienceBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 4, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.md, borderWidth: 1,
  },
  audienceText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  // Inputs
  scrollContent: { padding: 16, paddingBottom: 100 },
  titleInput: {
    fontSize: FontSize['2xl'], fontWeight: FontWeight.bold,
    paddingVertical: 4, marginBottom: 4, minHeight: 40,
  },
  descInput: {
    fontSize: FontSize.md, lineHeight: 22, paddingVertical: 4,
    minHeight: 120, marginBottom: 8,
  },
  errorText: {
    fontSize: FontSize.xs, color: Palette.red500,
    marginBottom: 8, marginLeft: 2,
  },

  // Action panels
  panel: {
    borderRadius: Radius.xl, borderWidth: 1, padding: 14,
    marginBottom: 12, gap: 10,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  panelTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  // Bottom action bar
  actionBar: { borderTopWidth: 0.5, paddingTop: 6 },
  actionScroll: { paddingHorizontal: 8, gap: 4 },
  actionItem: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 12, paddingVertical: 8, gap: 2, minWidth: 60,
  },
  actionLabel: { fontSize: 10, fontWeight: FontWeight.medium },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, paddingTop: 16, borderTopWidth: 0.5, marginTop: 8 },
  statBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
  },
  statText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },

  // Estimated hours
  estRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  estInput: {
    flex: 1, fontSize: FontSize.sm, paddingVertical: 6,
    borderBottomWidth: 1,
  },
});

export default TicketFormFB;
