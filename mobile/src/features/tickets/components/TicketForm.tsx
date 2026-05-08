/**
 * TicketForm — dual-mode form (page + modal) for creating and editing tickets.
 *
 * Follows mobile-form-pattern.md exactly:
 *  - RHF + zodResolver (no manual useState form state)
 *  - AppFormField for all text inputs
 *  - Controller for ChipSelector (priority, status) and AppDatePicker (dueDate)
 *  - FormSection grouping with hasError on collapsible sections
 *  - doSave pattern with duplicate detection + networkEvents.onOkPress
 *  - toast.success() BEFORE onClose()
 *
 * Auxiliary data (employees, customers, applications) is fetched via useAuxData
 * and rendered as AppSelect dropdowns.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminFormPage  from '@/src/features/admin/shared/AdminFormPage';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormSection    from '@/src/shared/components/forms/FormSection';
import ChipSelector   from '@/src/shared/components/forms/ChipSelector';
import AppDatePicker  from '@/src/shared/components/forms/AppDatePicker';
import { AppTextInput, AppFormField } from '@/src/shared/components';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import { useToast } from '@/src/shared/hooks/useToast';
import { useAuxData } from '@/src/shared/hooks/useAuxData';
import { networkEvents } from '@/src/services/api/networkEvents';
import { FontSize, FontWeight, Radius, Palette } from '@/src/constants/tokens';
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

// ── Priority chip options ─────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    Palette.emerald500,
  MEDIUM: Palette.amber500,
  HIGH:   Palette.orange500,
  URGENT: Palette.red500,
};

const PRIORITY_OPTIONS = TICKET_PRIORITIES.map((p) => ({
  value: p,
  label: p.charAt(0) + p.slice(1).toLowerCase(),
  color: PRIORITY_COLORS[p],
}));

// ── Status chip options ───────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  OPEN:               Palette.amber500,
  IN_PROGRESS:        Palette.blue500,
  PROGRAMMING:        Palette.violet500,
  UNDER_DEVELOPMENT:  Palette.indigo500,
  CODE_REVIEW:        Palette.cyan500,
  TESTING:            Palette.teal500,
  RESOLVED:           Palette.emerald500,
  CLOSED:             Palette.zinc500,
};

const STATUS_LABELS: Record<string, string> = {
  OPEN:               'Open',
  IN_PROGRESS:        'In Progress',
  PROGRAMMING:        'Programming',
  UNDER_DEVELOPMENT:  'Under Development',
  CODE_REVIEW:        'Code Review',
  TESTING:            'Testing',
  RESOLVED:           'Resolved',
  CLOSED:             'Closed',
};

const STATUS_OPTIONS = TICKET_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s] ?? s,
  color: STATUS_COLORS[s],
}));

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  item:       Ticket | null;
  onClose:    () => void;
  onSave:     (data: CreateTicketData) => Promise<void>;
  submitting: boolean;
  mode?:      'page' | 'modal';
}

// ── Component ─────────────────────────────────────────────────────────────────

const TicketForm: React.FC<Props> = ({
  item, onClose, onSave, submitting, mode = 'page',
}) => {
  const { t }  = useTranslation();
  const toast  = useToast();
  const isEdit = item != null;

  // ── Duplicate detection ────────────────────────────────────────────────────
  const isDuplicateError = useRef(false);

  useEffect(() => {
    const unsub = networkEvents.onOkPress(() => {
      if (isDuplicateError.current) {
        isDuplicateError.current = false;
        onClose();
      }
    });
    return () => { unsub(); };
  }, [onClose]);

  // ── Auxiliary data ─────────────────────────────────────────────────────────
  const { data: employees = [] } = useAuxData(
    ['ticket-form-employees'],
    () => usersApi.getEmployees(),
  );
  const { data: customers = [] } = useAuxData(
    ['ticket-form-customers'],
    () => customersApi.getCustomers(),
  );
  const { data: applications = [] } = useAuxData(
    ['ticket-form-applications'],
    () => applicationsApi.getApplications(),
  );

  // ── RHF setup ──────────────────────────────────────────────────────────────
  const toDateStr = (v: unknown): string => {
    if (!v) return '';
    const d = v instanceof Date ? v : new Date(v as string);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(createTicketFormSchema(t, isEdit)) as any,
    mode: 'onBlur',
    defaultValues: {
      title:          item?.title          ?? '',
      description:    item?.description    ?? '',
      priority:       item?.priority       ?? 'MEDIUM',
      status:         item?.status         ?? undefined,
      assignedToId:   item?.assignedToId   ?? null,
      customerId:     item?.customerId     ?? null,
      applicationId:  item?.applicationId  ?? null,
      dueDate:        toDateStr(item?.dueDate),
      estimatedHours: item?.estimatedHours ?? null,
    },
  });

  const { control, handleSubmit, formState: { isSubmitting, errors } } = form;

  // ── Keyboard chain ─────────────────────────────────────────────────────────
  const firstInputRef    = useFocusInput({ inModal: mode === 'modal', enabled: true, delay: mode === 'page' ? 100 : undefined });
  const descriptionRef   = useRef<any>(null);
  const estimatedHrsRef  = useRef<any>(null);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const doSave = async (data: TicketFormValues) => {
    try {
      await onSave({
        title:          data.title,
        description:    data.description,
        priority:       data.priority,
        status:         data.status,
        assignedToId:   data.assignedToId   ?? undefined,
        customerId:     data.customerId     ?? undefined,
        applicationId:  data.applicationId  ?? undefined,
        // Convert YYYY-MM-DD → ISO datetime (backend expects datetime string)
        dueDate:        data.dueDate
          ? (data.dueDate.includes('T') ? data.dueDate : `${data.dueDate}T00:00:00.000Z`)
          : undefined,
        estimatedHours: data.estimatedHours ?? undefined,
      } as CreateTicketData);

      // ✅ Toast BEFORE onClose — component unmounts on close
      toast.success(isEdit ? t('tickets.messages.updated') : t('tickets.messages.created'));
      onClose();
    } catch (err: any) {
      // NetworkErrorDialog handles all API errors automatically via httpClient interceptor.
      // Only special-case duplicate title errors.
      const serverMsg: string =
        err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';
      if (serverMsg.toLowerCase().includes('already exists')) {
        isDuplicateError.current = true;
        toast.error(t('tickets.duplicateError.title'), t('tickets.duplicateError.message'));
      }
      // All other errors: NetworkErrorDialog already showed — do NOT toast here
    }
  };

  const formTitle  = isEdit ? t('tickets.editTitle') : t('tickets.addTitle');
  const isDisabled = submitting || isSubmitting;

  // ── Selector options ───────────────────────────────────────────────────────
  const employeeOptions = employees.map((u) => ({
    value: u.id,
    label: u.name,
  }));
  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const applicationOptions = applications.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  // ── Fields JSX — shared between page and modal ────────────────────────────
  const fields_jsx = (
    <>
      {/* Required fields — always expanded */}
      <FormSection
        title={t('tickets.sections.basicInfo')}
        icon="🎫"
        hasError={!!(errors.title || errors.description)}
      >
        <AppFormField name="title" control={control}>
          <AppTextInput
            inputRef={firstInputRef}
            nextRef={descriptionRef}
            label={t('tickets.form.title')}
            placeholder={t('tickets.form.titlePlaceholder')}
            required
            autoCapitalize="sentences"
            maxLength={120}
            showClearButton
          />
        </AppFormField>

        <AppFormField name="description" control={control}>
          <AppTextInput
            inputRef={descriptionRef}
            label={t('tickets.form.description')}
            placeholder={t('tickets.form.descriptionPlaceholder')}
            required
            autoCapitalize="sentences"
            maxLength={500}
            showClearButton
            multiline
            numberOfLines={4}
            blurOnSubmit
          />
        </AppFormField>
      </FormSection>

      {/* Priority — required chip selector */}
      <FormSection
        title={t('tickets.sections.priority')}
        icon="🔥"
        hasError={!!errors.priority}
      >
        <Controller
          name="priority"
          control={control}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <ChipSelector
              label={t('tickets.form.priority')}
              options={PRIORITY_OPTIONS}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </FormSection>

      {/* Status — edit mode only */}
      {isEdit && (
        <FormSection
          title={t('tickets.sections.status')}
          icon="🔄"
          hasError={!!errors.status}
        >
          <Controller
            name="status"
            control={control}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <ChipSelector
                label={t('tickets.form.status')}
                options={STATUS_OPTIONS}
                value={value ?? null}
                onChange={onChange}
              />
            )}
          />
        </FormSection>
      )}

      {/* Assignment — collapsible */}
      <FormSection
        title={t('tickets.sections.assignment')}
        icon="👤"
        collapsible
        defaultCollapsed={!item?.assignedToId}
        hasError={!!errors.assignedToId}
      >
        <Controller
          name="assignedToId"
          control={control}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <ChipSelector
              label={t('tickets.form.assignedTo')}
              options={[
                { value: null as any, label: t('tickets.form.unassigned') },
                ...employeeOptions,
              ]}
              value={value ?? null}
              onChange={onChange}
            />
          )}
        />
      </FormSection>

      {/* Linked to — collapsible */}
      <FormSection
        title={t('tickets.sections.linkedTo')}
        icon="🔗"
        collapsible
        defaultCollapsed={!item?.customerId && !item?.applicationId}
        hasError={!!(errors.customerId || errors.applicationId)}
      >
        <Controller
          name="customerId"
          control={control}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <ChipSelector
              label={t('tickets.form.customer')}
              options={[
                { value: null as any, label: t('tickets.form.noCustomer') },
                ...customerOptions,
              ]}
              value={value ?? null}
              onChange={onChange}
            />
          )}
        />

        <Controller
          name="applicationId"
          control={control}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <ChipSelector
              label={t('tickets.form.application')}
              options={[
                { value: null as any, label: t('tickets.form.noApplication') },
                ...applicationOptions,
              ]}
              value={value ?? null}
              onChange={onChange}
            />
          )}
        />
      </FormSection>

      {/* Scheduling — collapsible */}
      <FormSection
        title={t('tickets.sections.scheduling')}
        icon="📅"
        collapsible
        defaultCollapsed={!item?.dueDate && !item?.estimatedHours}
        last={!isEdit}
        hasError={!!(errors.dueDate || errors.estimatedHours)}
      >
        <Controller
          name="dueDate"
          control={control}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <AppDatePicker
              label={t('tickets.form.dueDate')}
              value={value ?? ''}
              onChange={onChange}
              placeholder={t('tickets.form.dueDatePlaceholder')}
            />
          )}
        />

        <AppFormField name="estimatedHours" control={control}>
          <AppTextInput
            inputRef={estimatedHrsRef}
            label={t('tickets.form.estimatedHours')}
            placeholder={t('tickets.form.estimatedHoursPlaceholder')}
            fieldType="number"
            maxLength={6}
            showClearButton
            blurOnSubmit
          />
        </AppFormField>
      </FormSection>

      {/* Linked stats — edit mode only */}
      {isEdit && item && (
        <View style={styles.statsRow}>
          <LinkedStatCard
            value={item._count?.comments ?? 0}
            label={t('tickets.columns.comments')}
            color={Palette.blue700}
            bg="#eff6ff"
            border="#bfdbfe"
          />
        </View>
      )}
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  if (mode === 'page') {
    return (
      <AdminFormPage
        title={formTitle}
        onBack={onClose}
        onSubmit={doSave}
        submitting={isDisabled}
        form={form}
        submitLabel={t('common.save')}
      >
        {fields_jsx}
      </AdminFormPage>
    );
  }

  return (
    <AdminFormModal
      open
      title={formTitle}
      onClose={onClose}
      onSubmit={handleSubmit(doSave)}
      submitting={isDisabled}
      submitLabel={t('common.save')}
    >
      {fields_jsx}
    </AdminFormModal>
  );
};

// ── Linked stat card (edit mode only) ────────────────────────────────────────

const LinkedStatCard: React.FC<{
  value: number;
  label: string;
  color: string;
  bg: string;
  border: string;
}> = ({ value, label, color, bg, border }) => (
  <View style={[styles.statCard, { backgroundColor: bg, borderColor: border }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:  { flex: 1, padding: 14, borderRadius: Radius.xl, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, marginTop: 3, fontWeight: FontWeight.medium },
});

export default TicketForm;

