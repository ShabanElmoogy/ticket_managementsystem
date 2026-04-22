import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormField from '@/src/features/admin/shared/FormField';
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
}

/**
 * ApplicationForm — thin presentation component.
 *
 * All state, validation, and submit logic lives in useApplicationForm.
 * This component only renders fields and wires up hooks.
 */
const ApplicationForm: React.FC<Props> = ({ item, onClose, onSave, submitting }) => {
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

  // Auto-focus the first input when the modal opens
  const firstInputRef = useFocusInput({ inModal: true, enabled: true });

  const onSubmit = async () => {
    await handleSubmit();
    // Scroll to first error field after validation failure
    if (firstErrorFieldId) {
      scrollToFirstError([firstErrorFieldId]);
    }
  };

  return (
    <AdminFormModal
      open
      title={item ? t('applications.editTitle') : t('applications.addTitle')}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting || isSubmitting}
      submitDisabled={submitting || isSubmitting || !isDirty}
      submitLabel={t('common.save')}
    >
      <FormField fieldId="name">
        <AppTextInput
          inputRef={firstInputRef}
          label={t('applications.form.name')}
          value={fields.name}
          onChangeText={(v) => handleChange('name', v)}
          placeholder={t('applications.form.namePlaceholder')}
          error={errors.name}
          autoCapitalize="words"
          maxLength={100}
          showClearButton
          onClear={() => handleClear('name')}
        />
      </FormField>

      <FormField fieldId="version">
        <AppTextInput
          label={t('applications.form.version')}
          value={fields.version}
          onChangeText={(v) => handleChange('version', v)}
          placeholder={t('applications.form.versionPlaceholder')}
          error={errors.version}
          autoCapitalize="none"
          maxLength={50}
          showClearButton
          onClear={() => handleClear('version')}
        />
      </FormField>

      <FormField fieldId="description">
        <AppTextInput
          label={t('applications.form.description')}
          value={fields.description}
          onChangeText={(v) => handleChange('description', v)}
          placeholder={t('applications.form.descriptionPlaceholder')}
          error={errors.description}
          autoCapitalize="sentences"
          maxLength={500}
          showClearButton
          onClear={() => handleClear('description')}
        />
      </FormField>
    </AdminFormModal>
  );
};

export default ApplicationForm;
