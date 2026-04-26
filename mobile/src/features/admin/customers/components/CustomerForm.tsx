import React, { useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
import AdminFormPage  from '@/src/features/admin/shared/AdminFormPage';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormField      from '@/src/features/admin/shared/FormField';
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
      {/* ── Required fields ── */}
      <FormField fieldId="name">
        <AppTextInput
          inputRef={firstInputRef}
          nextRef={emailRef}
          label={t('customers.form.name')}
          value={fields.name}
          onChangeText={onChangeName}
          placeholder={t('customers.form.namePlaceholder')}
          error={errors.name}
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
          fieldType="email"
          maxLength={150}
          showClearButton
          onClear={onClearEmail}
        />
      </FormField>

      {/* ── Optional contact ── */}
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

      {/* ── Maintenance type selector ── */}
      <FormField fieldId="maintenanceType">
        <MaintenanceTypeSelector
          value={fields.maintenanceType}
          onChange={(v) => handleChange('maintenanceType', v)}
          t={t}
        />
      </FormField>

      {/* ── Subscription dates — only for MONTHLY_SUBSCRIPTION and FREE_TRIAL ── */}
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

      {/* ── Linked stats (edit mode only) ── */}
      {item && (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#1d4ed8' }}>{linkedTickets}</Text>
            <Text style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}>{t('customers.columns.tickets')}</Text>
          </View>
          <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#065f46' }}>{linkedApplications}</Text>
            <Text style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>{t('customers.detail.applications')}</Text>
          </View>
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

// ── Maintenance type selector ─────────────────────────────────────────────────

interface SelectorProps {
  value:    MaintenanceType | null;
  onChange: (v: MaintenanceType | null) => void;
  t:        (key: string) => string;
}

const MaintenanceTypeSelector: React.FC<SelectorProps> = ({ value, onChange, t }) => {
  const c      = useThemeColors();
  const labelColor = c.text.primary;
  const border     = c.border.primary;
  const bg         = c.surface.primary;

  // Labels via t() — RTL-safe
  const MAINTENANCE_LABELS: Record<MaintenanceType, string> = {
    MONTHLY_SUBSCRIPTION: t('customers.maintenance.monthly'),
    FREE_TRIAL:           t('customers.maintenance.trial'),
    PAY_AS_YOU_GO:        t('customers.maintenance.payAsYouGo'),
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: labelColor }}>
        {t('customers.detail.maintenanceType')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MAINTENANCE_TYPES.map((type) => (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            style={{
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
              borderWidth: 1.5,
              borderColor: value === type ? '#3b82f6' : border,
              backgroundColor: value === type ? c.surface.secondary : bg,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: value === type ? '#2563eb' : c.text.secondary }}>
              {MAINTENANCE_LABELS[type]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default CustomerForm;
