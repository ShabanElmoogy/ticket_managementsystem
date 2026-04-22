import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AdminFormPage  from '@/src/features/admin/shared/AdminFormPage';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormField      from '@/src/features/admin/shared/FormField';
import { useFormScroll } from '@/src/features/admin/shared/FormScrollContext';
import { AppTextInput } from '@/src/shared/components';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import { useApplicationForm } from '../hooks/useApplicationForm';
import type { Application, CreateApplicationData } from '@/src/services/api/types';

interface Props {
  item:        Application | null;
  onClose:     () => void;
  onSave:      (data: CreateApplicationData) => Promise<void>;
  submitting:  boolean;
  /** 'page' renders a full-screen form. 'modal' renders a bottom sheet. Default: 'page' */
  mode?:       'page' | 'modal';
}

/**
 * ApplicationForm — works in both page and modal mode.
 *
 * mode="page"  → AdminFormPage  (recommended — no keyboard issues)
 * mode="modal" → AdminFormModal (bottom sheet — use for quick edits)
 */
const ApplicationForm: React.FC<Props> = ({
  item, onClose, onSave, submitting, mode = 'page',
}) => {
  const { t }                  = useTranslation();
  const { scrollToFirstError } = useFormScroll();

  const {
    fields,
    errors,
    isDirty,
    firstErrorFieldId,
    isSubmitting,
    handleChange,
    handleClear,
    handleSubmit,
  } = useApplicationForm({ item, onSave, onClose });

  // Auto-focus first input — no delay needed in page mode (OS handles it)
  const firstInputRef = useFocusInput({
    inModal: mode === 'modal',
    enabled: true,
  });

  // Stable per-field handlers
  const onChangeName        = useCallback((v: string) => handleChange('name', v),        [handleChange]);
  const onChangeVersion     = useCallback((v: string) => handleChange('version', v),     [handleChange]);
  const onChangeDescription = useCallback((v: string) => handleChange('description', v), [handleChange]);
  const onClearName         = useCallback(() => handleClear('name'),        [handleClear]);
  const onClearVersion      = useCallback(() => handleClear('version'),     [handleClear]);
  const onClearDescription  = useCallback(() => handleClear('description'), [handleClear]);

  const onSubmit = useCallback(async () => {
    await handleSubmit();
    if (firstErrorFieldId) {
      scrollToFirstError([firstErrorFieldId]);
    }
  }, [handleSubmit, firstErrorFieldId, scrollToFirstError]);

  const formTitle      = item ? t('applications.editTitle') : t('applications.addTitle');
  const isDisabled     = submitting || isSubmitting || !isDirty;
  const isSubmittingAll = submitting || isSubmitting;

  // ── Shared fields ─────────────────────────────────────────────────────────
  const fields_jsx = (
    <>
      <FormField fieldId="name">
        <AppTextInput
          inputRef={firstInputRef}
          label={t('applications.form.name')}
          value={fields.name}
          onChangeText={onChangeName}
          placeholder={t('applications.form.namePlaceholder')}
          error={errors.name}
          autoCapitalize="words"
          maxLength={100}
          showClearButton
          onClear={onClearName}
        />
      </FormField>

      <FormField fieldId="version">
        <AppTextInput
          label={t('applications.form.version')}
          value={fields.version}
          onChangeText={onChangeVersion}
          placeholder={t('applications.form.versionPlaceholder')}
          error={errors.version}
          autoCapitalize="none"
          maxLength={50}
          showClearButton
          onClear={onClearVersion}
        />
      </FormField>

      <FormField fieldId="description">
        <AppTextInput
          label={t('applications.form.description')}
          value={fields.description}
          onChangeText={onChangeDescription}
          placeholder={t('applications.form.descriptionPlaceholder')}
          error={errors.description}
          autoCapitalize="sentences"
          maxLength={500}
          showClearButton
          onClear={onClearDescription}
        />
      </FormField>
    </>
  );

  // ── Page mode (default — recommended) ────────────────────────────────────
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

  // ── Modal mode (bottom sheet) ─────────────────────────────────────────────
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

export default ApplicationForm;
