import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormField from '@/src/features/admin/shared/FormField';
import { AppTextInput } from '@/src/shared/components';
import { createApplicationFormSchema } from '../schemas/applicationSchema';
import type { Application, CreateApplicationData } from '@/src/services/api/types';

interface Props {
  item: Application | null;
  onClose: () => void;
  onSave: (data: CreateApplicationData) => Promise<void>;
  submitting: boolean;
}

const ApplicationForm: React.FC<Props> = ({ item, onClose, onSave, submitting }) => {
  const { t } = useTranslation();
  const [name,        setName]        = useState(item?.name        ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [version,     setVersion]     = useState(item?.version     ?? '');
  const [errors,      setErrors]      = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const result = createApplicationFormSchema(t).safeParse({ name, description, version });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        if (e.path[0]) fieldErrors[String(e.path[0])] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSave({
      name:        result.data.name,
      description: result.data.description || undefined,
      version:     result.data.version     || undefined,
    });
  };

  return (
    <AdminFormModal
      open
      title={item ? t('applications.editTitle') : t('applications.addTitle')}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      <FormField>
        <AppTextInput
          label={t('applications.form.name')}
          value={name}
          onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
          placeholder={t('applications.form.namePlaceholder')}
          error={errors.name}
          autoCapitalize="words"
          maxLength={100}
          showClearButton
          onClear={() => { setName(''); setErrors((e) => ({ ...e, name: '' })); }}
        />
      </FormField>
      <FormField>
        <AppTextInput
          label={t('applications.form.version')}
          value={version}
          onChangeText={(v) => { setVersion(v); setErrors((e) => ({ ...e, version: '' })); }}
          placeholder={t('applications.form.versionPlaceholder')}
          error={errors.version}
          autoCapitalize="none"
          maxLength={50}
          showClearButton
          onClear={() => { setVersion(''); setErrors((e) => ({ ...e, version: '' })); }}
        />
      </FormField>
      <FormField>
        <AppTextInput
          label={t('applications.form.description')}
          value={description}
          onChangeText={(v) => { setDescription(v); setErrors((e) => ({ ...e, description: '' })); }}
          placeholder={t('applications.form.descriptionPlaceholder')}
          error={errors.description}
          autoCapitalize="sentences"
          maxLength={500}
          showClearButton
          onClear={() => { setDescription(''); setErrors((e) => ({ ...e, description: '' })); }}
        />
      </FormField>
    </AdminFormModal>
  );
};

export default ApplicationForm;
