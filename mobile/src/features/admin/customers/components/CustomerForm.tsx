import React, { useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors, useIsDark, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import AdminFormPage  from '@/src/features/admin/shared/AdminFormPage';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormField      from '@/src/features/admin/shared/FormField';
import FormSection    from '@/src/shared/components/forms/FormSection';
import { useFormScroll } from '@/src/features/admin/shared/FormScrollContext';
import { AppTextInput } from '@/src/shared/components';
import AppDatePicker from '@/src/shared/components/forms/AppDatePicker';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import { useCustomerForm } from '../hooks/useCustomerForm';
import { MAINTENANCE_TYPES, type MaintenanceType } from '../schemas/customerSchema';
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
  const { t }                  = useTranslation();
  const { scrollToFirstError } = useFormScroll();
  const c                      = useThemeColors();

  const {
    fields, errors, isDirty, firstErrorFieldId,
    isSubmitting, handleChange, handleClear, handleSubmit,
  } = useCustomerForm({ item, onSave, onClose });

  const firstInputRef = useFocusInput({ inModal: mode === 'modal', enabled: true, delay: mode === 'page' ? 100 : undefined });

  // Return-key chain: Name → Email → Phone → Company → Address → done
  const emailRef   = useRef<TextInput | null>(null);
  const phoneRef   = useRef<TextInput | null>(null);
  const companyRef = useRef<TextInput | null>(null);
  const addressRef = useRef<TextInput | null>(null);

  // Stable handlers
  const onChangeName    = useCallback((v: string) => handleChange('name',    v), [handleChange]);
  const onChangeEmail   = useCallback((v: string) => handleChange('email',   v), [handleChange]);
  const onChangePhone   = useCallback((v: string) => handleChange('phone',   v), [handleChange]);
  const onChangeCompany = useCallback((v: string) => handleChange('company', v), [handleChange]);
  const onChangeAddress = useCallback((v: string) => handleChange('address', v), [handleChange]);

  const onClearName    = useCallback(() => handleClear('name'),    [handleClear]);
  const onClearEmail   = useCallback(() => handleClear('email'),   [handleClear]);
  const onClearPhone   = useCallback(() => handleClear('phone'),   [handleClear]);
  const onClearCompany = useCallback(() => handleClear('company'), [handleClear]);
  const onClearAddress = useCallback(() => handleClear('address'), [handleClear]);

  const onSubmit = useCallback(async () => {
    await handleSubmit();
    if (firstErrorFieldId) scrollToFirstError([firstErrorFieldId]);
  }, [handleSubmit, firstErrorFieldId, scrollToFirstError]);

  const formTitle       = item ? t('customers.editTitle') : t('customers.addTitle');
  const isDisabled      = submitting || isSubmitting;
  const isSubmittingAll = submitting || isSubmitting;

  // Linked stats (edit mode only)
  const linkedTickets      = item?._count?.tickets      ?? 0;
  const linkedApplications = item?.applications?.length ?? 0;

  const fields_jsx = (
    <>
      {/* ── Basic Info ── */}
      <FormSection title={t('customers.sections.basicInfo')} icon="👤">
        <FormField fieldId="name">
          <AppTextInput
            inputRef={firstInputRef}
            nextRef={emailRef}
            label={t('customers.form.name')}
            value={fields.name}
            onChangeText={onChangeName}
            placeholder={t('customers.form.namePlaceholder')}
            error={errors.name}
            required
            autoCapitalize="words"
            maxLength={100}
            showClearButton
            onClear={onClearName}
          />
        </FormField>
        <FormField fieldId="email">
          <AppTextInput
            inputRef={emailRef}
            nextRef={phoneRef}
            label={t('customers.form.email')}
            value={fields.email}
            onChangeText={onChangeEmail}
            placeholder={t('customers.form.emailPlaceholder')}
            error={errors.email}
            required
            fieldType="email"
            maxLength={150}
            showClearButton
            onClear={onClearEmail}
          />
        </FormField>
        <FormField fieldId="phone">
          <AppTextInput
            inputRef={phoneRef}
            nextRef={companyRef}
            label={t('customers.form.phone')}
            value={fields.phone}
            onChangeText={onChangePhone}
            placeholder={t('customers.form.phonePlaceholder')}
            error={errors.phone}
            maxLength={30}
            showClearButton
            onClear={onClearPhone}
          />
        </FormField>
      </FormSection>

      {/* ── Company ── */}
      <FormSection title={t('customers.sections.company')} icon="🏢">
        <FormField fieldId="company">
          <AppTextInput
            inputRef={companyRef}
            nextRef={addressRef}
            label={t('customers.form.company')}
            value={fields.company}
            onChangeText={onChangeCompany}
            placeholder={t('customers.form.companyPlaceholder')}
            error={errors.company}
            autoCapitalize="words"
            maxLength={100}
            showClearButton
            onClear={onClearCompany}
          />
        </FormField>
        <FormField fieldId="address">
          <AppTextInput
            inputRef={addressRef}
            label={t('customers.form.address')}
            value={fields.address}
            onChangeText={onChangeAddress}
            placeholder={t('customers.form.addressPlaceholder')}
            error={errors.address}
            autoCapitalize="sentences"
            maxLength={255}
            showClearButton
            onClear={onClearAddress}
            multiline
            numberOfLines={2}
            blurOnSubmit
          />
        </FormField>
      </FormSection>

      {/* ── Subscription ── */}
      <FormSection title={t('customers.sections.subscription')} icon="💳" last={!item}>
        <FormField fieldId="maintenanceType">
          <MaintenanceTypeSelector
            value={fields.maintenanceType}
            onChange={(v) => handleChange('maintenanceType', v)}
            t={t}
          />
        </FormField>

        {fields.maintenanceType && fields.maintenanceType !== 'PAY_AS_YOU_GO' && (
          <>
            <FormField fieldId="subscriptionStartDate">
              <AppDatePicker
                label={t('customers.detail.subscriptionStart')}
                value={fields.subscriptionStartDate}
                onChange={(iso) => handleChange('subscriptionStartDate', iso)}
                placeholder={t('customers.form.datePlaceholder')}
                error={errors.subscriptionStartDate}
              />
            </FormField>
            <FormField fieldId="subscriptionEndDate">
              <AppDatePicker
                label={t('customers.detail.subscriptionEnd')}
                value={fields.subscriptionEndDate}
                onChange={(iso) => handleChange('subscriptionEndDate', iso)}
                placeholder={t('customers.form.datePlaceholder')}
                error={errors.subscriptionEndDate}
                minDate={fields.subscriptionStartDate ? new Date(fields.subscriptionStartDate) : undefined}
              />
            </FormField>
          </>
        )}
      </FormSection>

      {/* ── Linked stats (edit mode) ── */}
      {item && (
        <View style={styles.statsRow}>
          <StatCard value={linkedTickets}      label={t('customers.columns.tickets')}      color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" />
          <StatCard value={linkedApplications} label={t('customers.detail.applications')}  color="#065f46" bg="#f0fdf4" border="#bbf7d0" />
        </View>
      )}
    </>
  );

  if (mode === 'page') {
    return (
      <AdminFormPage
        title={formTitle}
        onBack={onClose}
        onSubmit={onSubmit}
        submitting={isSubmittingAll}
        submitDisabled={isDisabled}
        isDirty={isDirty}
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
      onSubmit={onSubmit}
      submitting={isSubmittingAll}
      submitDisabled={isDisabled}
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

// ── Maintenance type selector ─────────────────────────────────────────────────

interface SelectorProps {
  value:    MaintenanceType | null;
  onChange: (v: MaintenanceType | null) => void;
  t:        (key: string) => string;
}

const MaintenanceTypeSelector: React.FC<SelectorProps> = ({ value, onChange, t }) => {
  const c      = useThemeColors();
  const isDark = useIsDark();

  const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
    MONTHLY_SUBSCRIPTION: t('customers.maintenance.monthly'),
    FREE_TRIAL:           t('customers.maintenance.trial'),
    PAY_AS_YOU_GO:        t('customers.maintenance.payAsYouGo'),
  };

  return (
    <View style={styles.selectorContainer}>
      <Text style={[styles.selectorLabel, { color: c.text.secondary }]}>
        {t('customers.detail.maintenanceType')}
      </Text>
      <View style={styles.chipRow}>
        {MAINTENANCE_TYPES.map((type) => {
          const active = value === type;
          return (
            <Pressable
              key={type}
              onPress={() => onChange(type)}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderColor:     active ? c.interactive.primary : c.border.primary,
                  backgroundColor: active
                    ? (isDark ? '#1a2e4a' : '#eff6ff')
                    : pressed
                    ? c.surface.tertiary
                    : c.surface.secondary,
                },
              ]}
            >
              {active && <Text style={styles.chipCheck}>✓ </Text>}
              <Text style={[
                styles.chipText,
                { color: active ? c.interactive.primary : c.text.secondary },
              ]}>
                {MAINTENANCE_LABELS[type]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  16,
  },
  statCard: {
    flex:          1,
    padding:       14,
    borderRadius:  Radius.xl,
    borderWidth:   1,
    alignItems:    'center',
  },
  statValue: {
    fontSize:   FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
  },
  statLabel: {
    fontSize:  FontSize.xs,
    marginTop: 3,
    fontWeight: FontWeight.medium,
  },
  selectorContainer: {
    marginBottom: 4,
  },
  selectorLabel: {
    fontSize:      FontSize.sm,
    fontWeight:    FontWeight.semibold,
    marginBottom:  8,
    letterSpacing: 0.1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
    marginBottom:  4,
  },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 14,
    paddingVertical:   9,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
  },
  chipCheck: {
    fontSize:   FontSize.sm,
    color:      '#2563eb',
    fontWeight: FontWeight.bold,
  },
  chipText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});

export default CustomerForm;
