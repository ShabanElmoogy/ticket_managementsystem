import React, { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';
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

  const firstInputRef = useFocusInput({ inModal: mode === 'modal', enabled: true, delay: mode === 'page' ? 100 : undefined });
  const emailRef      = useRef<TextInput | null>(null);
  const phoneRef      = useRef<TextInput | null>(null);

  // Stable handlers
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

  const formTitle      = item ? t('customers.editTitle') : t('customers.addTitle');
  const isDisabled     = submitting || isSubmitting || !isDirty;
  const isSubmittingAll = submitting || isSubmitting;

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
