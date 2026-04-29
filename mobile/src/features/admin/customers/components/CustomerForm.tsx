import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FontSize, FontWeight, Radius } from '@/src/constants/theme';
import AdminFormPage  from '@/src/features/admin/shared/AdminFormPage';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormSection    from '@/src/shared/components/forms/FormSection';
import ChipSelector   from '@/src/shared/components/forms/ChipSelector';
import { AppTextInput, AppFormField } from '@/src/shared/components';
import AppDatePicker  from '@/src/shared/components/forms/AppDatePicker';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import { useToast } from '@/src/shared/hooks/useToast';
import { createCustomerFormSchema, type MaintenanceType } from '../schemas/customerSchema';
import type { Customer, CreateCustomerData } from '@/src/services/api/types';

interface Props {
  item:       Customer | null;
  onClose:    () => void;
  onSave:     (data: CreateCustomerData) => Promise<void>;
  submitting: boolean;
  mode?:      'page' | 'modal';
}

const CustomerForm: React.FC<Props> = ({
  item, onClose, onSave, submitting, mode = 'page',
}) => {
  const { t }  = useTranslation();
  const toast  = useToast();

  // ── RHF setup ──────────────────────────────────────────────────────────────
  const toDateStr = (v: unknown): string => {
    if (!v) return '';
    const d = v instanceof Date ? v : new Date(v as string);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const form = useForm({
    resolver: zodResolver(createCustomerFormSchema(t)),
    mode: 'onBlur',
    defaultValues: {
      name:                  item?.name                  ?? '',
      email:                 item?.email                 ?? '',
      phone:                 item?.phone                 ?? '',
      company:               item?.company               ?? '',
      address:               item?.address               ?? '',
      maintenanceType:       (item?.maintenanceType as MaintenanceType | null) ?? null,
      subscriptionStartDate: toDateStr(item?.subscriptionStartDate),
      subscriptionEndDate:   toDateStr(item?.subscriptionEndDate),
    },
  });

  const { control, handleSubmit, watch, formState: { isSubmitting } } = form;
  const maintenanceType = watch('maintenanceType');
  const needsDates = maintenanceType === 'MONTHLY_SUBSCRIPTION' || maintenanceType === 'FREE_TRIAL';

  // ── Keyboard chain ─────────────────────────────────────────────────────────
  const firstInputRef = useFocusInput({ inModal: mode === 'modal', enabled: true, delay: mode === 'page' ? 100 : undefined });
  const emailRef      = useRef<any>(null);
  const phoneRef      = useRef<any>(null);
  const companyRef    = useRef<any>(null);
  const addressRef    = useRef<any>(null);

  // ── Submit — pass doSave directly, AdminFormPage wraps with form.handleSubmit ──
  const doSave = async (data: any) => {
    try {
      await onSave({
        name:                  data.name,
        email:                 data.email,
        phone:                 data.phone                 || undefined,
        company:               data.company               || undefined,
        address:               data.address               || undefined,
        maintenanceType:       data.maintenanceType       ?? undefined,
        subscriptionStartDate: data.subscriptionStartDate ?? undefined,
        subscriptionEndDate:   data.subscriptionEndDate   ?? undefined,
      } as CreateCustomerData);
      toast.success(item ? t('customers.messages.updated') : t('customers.messages.created'));
      onClose();
    } catch {
      toast.error(item ? t('customers.messages.errorUpdate') : t('customers.messages.errorCreate'));
    }
  };

  const formTitle  = item ? t('customers.editTitle') : t('customers.addTitle');
  const isDisabled = submitting || isSubmitting;

  const linkedTickets      = item?._count?.tickets      ?? 0;
  const linkedApplications = item?.applications?.length ?? 0;

  // ── Fields JSX ─────────────────────────────────────────────────────────────
  const fields_jsx = (
    <>
      {/* Basic Info — always expanded (required fields) */}
      <FormSection title={t('customers.sections.basicInfo')} icon="👤">
        <AppFormField name="name" control={control}>
          <AppTextInput
            inputRef={firstInputRef}
            nextRef={emailRef}
            label={t('customers.form.name')}
            placeholder={t('customers.form.namePlaceholder')}
            required
            autoCapitalize="words"
            maxLength={100}
            showClearButton
          />
        </AppFormField>

        <AppFormField name="email" control={control}>
          <AppTextInput
            inputRef={emailRef}
            nextRef={phoneRef}
            label={t('customers.form.email')}
            placeholder={t('customers.form.emailPlaceholder')}
            required
            fieldType="email"
            maxLength={150}
            showClearButton
          />
        </AppFormField>

        <AppFormField name="phone" control={control}>
          <AppTextInput
            inputRef={phoneRef}
            nextRef={companyRef}
            label={t('customers.form.phone')}
            placeholder={t('customers.form.phonePlaceholder')}
            maxLength={30}
            keyboardType="phone-pad"
            showClearButton
          />
        </AppFormField>
      </FormSection>

      {/* Company — collapsible, starts collapsed */}
      <FormSection title={t('customers.sections.company')} icon="🏢" collapsible>
        <AppFormField name="company" control={control}>
          <AppTextInput
            inputRef={companyRef}
            nextRef={addressRef}
            label={t('customers.form.company')}
            placeholder={t('customers.form.companyPlaceholder')}
            autoCapitalize="words"
            maxLength={100}
            showClearButton
          />
        </AppFormField>

        <AppFormField name="address" control={control}>
          <AppTextInput
            inputRef={addressRef}
            label={t('customers.form.address')}
            placeholder={t('customers.form.addressPlaceholder')}
            autoCapitalize="sentences"
            maxLength={255}
            showClearButton
            multiline
            numberOfLines={2}
            blurOnSubmit
          />
        </AppFormField>
      </FormSection>

      {/* Subscription */}
      <FormSection title={t('customers.sections.subscription')} icon="💳" last={!item} collapsible>
        <Controller
          name="maintenanceType"
          control={control}
          render={({ field: { value, onChange } }) => (
            <ChipSelector
              label={t('customers.detail.maintenanceType')}
              options={[
                { value: 'MONTHLY_SUBSCRIPTION', label: t('customers.maintenance.monthly'),    icon: '📅', description: t('customers.maintenance.monthlyDesc') },
                { value: 'FREE_TRIAL',           label: t('customers.maintenance.trial'),       icon: '🎁', description: t('customers.maintenance.trialDesc') },
                { value: 'PAY_AS_YOU_GO',        label: t('customers.maintenance.payAsYouGo'), icon: '💳', description: t('customers.maintenance.payAsYouGoDesc') },
              ]}
              value={value}
              onChange={onChange}
            />
          )}
        />

        {needsDates && (
          <>
            <Controller
              name="subscriptionStartDate"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <AppDatePicker
                  label={t('customers.detail.subscriptionStart')}
                  value={value ?? ''}
                  onChange={onChange}
                  placeholder={t('customers.form.datePlaceholder')}
                  error={error?.message}
                />
              )}
            />
            <Controller
              name="subscriptionEndDate"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <AppDatePicker
                  label={t('customers.detail.subscriptionEnd')}
                  value={value ?? ''}
                  onChange={onChange}
                  placeholder={t('customers.form.datePlaceholder')}
                  error={error?.message}
                  minDate={form.watch('subscriptionStartDate') ? new Date(form.watch('subscriptionStartDate')!) : undefined}
                />
              )}
            />
          </>
        )}
      </FormSection>

      {/* Linked stats (edit mode) */}
      {item && (
        <View style={styles.statsRow}>
          <StatCard value={linkedTickets}      label={t('customers.columns.tickets')}     color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" />
          <StatCard value={linkedApplications} label={t('customers.detail.applications')} color="#065f46" bg="#f0fdf4" border="#bbf7d0" />
        </View>
      )}
    </>
  );

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

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard: React.FC<{ value: number; label: string; color: string; bg: string; border: string }> = ({
  value, label, color, bg, border,
}) => (
  <View style={[styles.statCard, { backgroundColor: bg, borderColor: border }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, padding: 14, borderRadius: Radius.xl, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, marginTop: 3, fontWeight: FontWeight.medium },
});

export default CustomerForm;
