import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createCustomerFormSchema } from '../schemas/customerSchema';
import { useToast } from '@/src/shared/hooks/useToast';
import type { Customer, CreateCustomerData } from '@/src/services/api/types';

export interface CustomerFormValues {
  name:  string;
  email: string;
  phone: string;
}

export interface UseCustomerFormReturn {
  fields:            CustomerFormValues;
  errors:            Record<string, string>;
  isDirty:           boolean;
  firstErrorFieldId: string | null;
  isSubmitting:      boolean;
  handleChange:      (field: keyof CustomerFormValues, value: string) => void;
  handleClear:       (field: keyof CustomerFormValues) => void;
  handleSubmit:      () => Promise<void>;
}

interface Args {
  item:    Customer | null;
  onSave:  (data: CreateCustomerData) => Promise<void>;
  onClose: () => void;
}

export function useCustomerForm({ item, onSave, onClose }: Args): UseCustomerFormReturn {
  const { t } = useTranslation();
  const toast = useToast();

  const getInitial = useCallback(
    (): CustomerFormValues => ({
      name:  item?.name  ?? '',
      email: item?.email ?? '',
      phone: item?.phone ?? '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item?.id],
  );

  const [fields,            setFields]            = useState<CustomerFormValues>(getInitial);
  const [errors,            setErrors]            = useState<Record<string, string>>({});
  const [isDirty,           setIsDirty]           = useState(false);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [firstErrorFieldId, setFirstErrorFieldId] = useState<string | null>(null);

  // Sync when item changes (modal re-opened with different item)
  useEffect(() => {
    setFields(getInitial());
    setErrors({});
    setIsDirty(false);
    setFirstErrorFieldId(null);
  }, [getInitial]);

  const checkDirty = useCallback((next: CustomerFormValues): boolean => {
    const initial = getInitial();
    return (
      next.name  !== initial.name  ||
      next.email !== initial.email ||
      next.phone !== initial.phone
    );
  }, [getInitial]);

  const handleChange = useCallback((field: keyof CustomerFormValues, value: string) => {
    setFields((prev) => {
      const next = { ...prev, [field]: value };
      setIsDirty(checkDirty(next));
      return next;
    });
    // Delete the error key — never set to ''
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, [checkDirty]);

  const handleClear = useCallback(
    (field: keyof CustomerFormValues) => handleChange(field, ''),
    [handleChange],
  );

  const handleSubmit = useCallback(async () => {
    const result = createCustomerFormSchema(t).safeParse(fields);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? '');
        if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);

      const ORDER: Array<keyof CustomerFormValues> = ['name', 'email', 'phone'];
      setFirstErrorFieldId(ORDER.find((k) => k in fieldErrors) ?? null);

      toast.error(t('customers.messages.validationError'));
      return;
    }

    setErrors({});
    setFirstErrorFieldId(null);
    setIsSubmitting(true);

    try {
      await onSave({
        name:  result.data.name,
        email: result.data.email,
        phone: result.data.phone || undefined,
      });
      setIsDirty(false);
      // ⚠️ Toast BEFORE onClose — page unmounts on close
      toast.success(item ? t('customers.messages.updated') : t('customers.messages.created'));
      onClose();
    } catch {
      toast.error(item ? t('customers.messages.errorUpdate') : t('customers.messages.errorCreate'));
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, t, onSave, onClose, item, toast]);

  return {
    fields,
    errors,
    isDirty,
    firstErrorFieldId,
    isSubmitting,
    handleChange,
    handleClear,
    handleSubmit,
  };
}
