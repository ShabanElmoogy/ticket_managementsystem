import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import { AppTextInput } from '@/src/shared/components';
import { customerFormSchema } from '../schemas/customerSchema';
import type { Customer, CreateCustomerData } from '@/src/services/api/types';

interface Props {
  item: Customer | null;
  onClose: () => void;
  onSave: (data: CreateCustomerData) => Promise<void>;
  submitting: boolean;
}

const CustomerForm: React.FC<Props> = ({ item, onClose, onSave, submitting }) => {
  const { t } = useTranslation();
  const [name,   setName]   = useState(item?.name  ?? '');
  const [email,  setEmail]  = useState(item?.email ?? '');
  const [phone,  setPhone]  = useState(item?.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const result = customerFormSchema.safeParse({ name, email, phone });
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
      name:  result.data.name,
      email: result.data.email,
      phone: result.data.phone || undefined,
    });
  };

  return (
    <AdminFormModal
      open
      title={item ? t('customers.editTitle') : t('customers.addTitle')}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      <AppTextInput
        label={t('customers.form.name')}
        value={name}
        onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
        placeholder={t('customers.form.namePlaceholder')}
        error={errors.name}
      />
      <AppTextInput
        label={t('customers.form.email')}
        value={email}
        onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }}
        fieldType="email"
        placeholder={t('customers.form.emailPlaceholder')}
        error={errors.email}
      />
      <AppTextInput
        label={t('customers.form.phone')}
        value={phone}
        onChangeText={(v) => { setPhone(v); setErrors((e) => ({ ...e, phone: '' })); }}
        placeholder={t('customers.form.phonePlaceholder')}
        error={errors.phone}
      />
    </AdminFormModal>
  );
};

export default CustomerForm;
