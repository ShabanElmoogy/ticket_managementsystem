import React, { useCallback, useRef } from 'react';
import { View, Text, TextInput } from 'react-native';
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
  mode?:       'page' | 'modal';
}

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

  const firstInputRef  = useFocusInput({ inModal: mode === 'modal', enabled: true, delay: mode === 'page' ? 100 : undefined });
  const versionRef     = useRef<TextInput | null>(null);
  const descriptionRef = useRef<TextInput | null>(null);

  const onChangeName        = useCallback((v: string) => handleChange('name', v),        [handleChange]);
  const onChangeVersion     = useCallback((v: string) => handleChange('version', v),     [handleChange]);
  const onChangeDescription = useCallback((v: string) => handleChange('description', v), [handleChange]);
  const onClearName         = useCallback(() => handleClear('name'),        [handleClear]);
  const onClearVersion      = useCallback(() => handleClear('version'),     [handleClear]);
  const onClearDescription  = useCallback(() => handleClear('description'), [handleClear]);

  const onSubmit = useCallback(async () => {
    await handleSubmit();
    if (firstErrorFieldId) scrollToFirstError([firstErrorFieldId]);
  }, [handleSubmit, firstErrorFieldId, scrollToFirstError]);

  const formTitle       = item ? t('applications.editTitle') : t('applications.addTitle');
  const isDisabled      = submitting || isSubmitting;   // only disable while saving
  const isSubmittingAll = submitting || isSubmitting;

  // ── Linked stats (edit mode only) ─────────────────────────────────────────
  const linkedTickets   = item?._count?.tickets   ?? 0;
  const linkedCustomers = item?._count?.customers ?? 0;

  // ── Shared fields ─────────────────────────────────────────────────────────
  const fields_jsx = (
    <>
      {/* ── Name ── */}
      <FormField fieldId="name">
        <AppTextInput
          inputRef={firstInputRef}
          nextRef={versionRef}
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

      {/* ── Version ── */}
      <FormField fieldId="version">
        <AppTextInput
          inputRef={versionRef}
          nextRef={descriptionRef}
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

      {/* ── Description (multiline) ── */}
      <FormField fieldId="description">
        <AppTextInput
          inputRef={descriptionRef}
          label={t('applications.form.description')}
          value={fields.description}
          onChangeText={onChangeDescription}
          placeholder={t('applications.form.descriptionPlaceholder')}
          error={errors.description}
          autoCapitalize="sentences"
          maxLength={500}
          showClearButton
          onClear={onClearDescription}
          multiline
          numberOfLines={3}
          blurOnSubmit
        />
      </FormField>

      {/* ── Linked stats (edit mode only) ── */}
      {item && (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={{
            flex: 1, padding: 12, borderRadius: 10,
            backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#1d4ed8' }}>{linkedTickets}</Text>
            <Text style={{ fontSize: 11, color: '#3b82f6', marginTop: 2 }}>{t('applications.columns.tickets')}</Text>
          </View>
          <View style={{
            flex: 1, padding: 12, borderRadius: 10,
            backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#065f46' }}>{linkedCustomers}</Text>
            <Text style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>{t('applications.columns.customers')}</Text>
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

export default ApplicationForm;
