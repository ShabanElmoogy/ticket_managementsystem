import React, { useCallback, useRef } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import AdminFormPage  from '@/src/features/admin/shared/AdminFormPage';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormField      from '@/src/features/admin/shared/FormField';
import { useFormScroll } from '@/src/features/admin/shared/FormScrollContext';
import { AppTextInput } from '@/src/shared/components';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import { useCustomerForm } from '../hooks/useCustomerForm';
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

  const {
    fields, errors, isDirty, firstErrorFieldId,
    isSubmitting, handleChange, handleClear, handleSubmit,
  } = useCustomerForm({ item, onSave, onClose });

  // Auto-focus first input — shorter delay in page mode (no modal animation)
  const firstInputRef = useFocusInput({
    inModal: mode === 'modal',
    enabled: true,
    delay:   mode === 'page' ? 100 : undefined,
  });

  // Refs for return-key navigation: Name → Email → Phone → done
  const emailRef = useRef<TextInput | null>(null);
  const phoneRef = useRef<TextInput | null>(null);

  // Stable per-field handlers — prevent re-renders on every keystroke
  const onChangeName  = useCallback((v: string) => handleChange('name',  v), [handleChange]);
  const onChangeEmail = useCallback((v: string) => handleChange('email', v), [handleChange]);
  const onChangePhone = useCallback((v: string) => handleChange('phone', v), [handleChange]);
  const onClearName   = useCallback(() => handleClear('name'),  [handleClear]);
  const onClearEmail  = useCallback(() => handleClear('email'), [handleClear]);
  const onClearPhone  = useCallback(() => handleClear('phone'), [handleClear]);

  const onSubmit = useCallback(async () => {
    await handleSubmit();
    if (firstErrorFieldId) scrollToFirstError([firstErrorFieldId]);
  }, [handleSubmit, firstErrorFieldId, scrollToFirstError]);

  const formTitle       = item ? t('customers.editTitle') : t('customers.addTitle');
  // Only disable while actually submitting — button always pressable so user sees errors
  const isDisabled      = submitting || isSubmitting;
  const isSubmittingAll = submitting || isSubmitting;

  // Linked stats (edit mode only)
  const linkedTickets      = item?._count?.tickets      ?? 0;
  const linkedApplications = item?.applications?.length ?? 0;

  const fields_jsx = (
    <>
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

      <FormField fieldId="phone">
        <AppTextInput
          inputRef={phoneRef}
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

      {/* Linked stats — edit mode only */}
      {item && (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={{
            flex: 1, padding: 12, borderRadius: 10,
            backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#1d4ed8' }}>
              {linkedTickets}
            </Text>
            <Text style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}>
              {t('customers.columns.tickets')}
            </Text>
          </View>
          <View style={{
            flex: 1, padding: 12, borderRadius: 10,
            backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#065f46' }}>
              {linkedApplications}
            </Text>
            <Text style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>
              {t('customers.detail.applications')}
            </Text>
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

export default CustomerForm;
