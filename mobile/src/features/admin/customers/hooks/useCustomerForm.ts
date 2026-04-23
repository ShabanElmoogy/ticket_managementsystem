import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createCustomerFormSchema, type MaintenanceType } from '../schemas/customerSchema';
import { useToast } from '@/src/shared/hooks/useToast';
import type { Customer, CreateCustomerData } from '@/src/services/api/types';

export interface CustomerFormValues {
  name:                  string;
  email:                 string;
  phone:                 string;
  company:               string;
  address:               string;
  maintenanceType:       MaintenanceType | null;
  subscriptionStartDate: string;
  subscriptionEndDate:   string;
}

export interface UseCustomerFormReturn {
  fields:            CustomerFormValues;
  errors:            Record<string, string>;
  isDirty:           boolean;
  firstErrorFieldId: string | null;
  isSubmitting:      boolean;
  handleChange:      (field: keyof CustomerFormValues, value: string | MaintenanceType | null) => void;
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
      name:                  item?.name                  ?? '',
      email:                 item?.email                 ?? '',
      phone:                 item?.phone                 ?? '',
      company:               item?.company               ?? '',
      address:               item?.address               ?? '',
      maintenanceType:       (item?.maintenanceType as MaintenanceType | null) ?? null,
      subscriptionStartDate: item?.subscriptionStartDate ?? '',
      subscriptionEndDate:   item?.subscriptionEndDate   ?? '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item?.id],
  );

  const [fields,            setFields]            = useState<CustomerFormValues>(getInitial);
  const [errors,            setErrors]            = useState<Record<string, string>>({});
  const [isDirty,           setIsDirty]           = useState(false);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [firstErrorFieldId, setFirstErrorFieldId] = useState<string | null>(null);

  useEffect(() => {
    setFields(getInitial());
    setErrors({});
    setIsDirty(false);
    setFirstErrorFieldId(null);
  }, [getInitial]);

  const checkDirty = useCallback((next: CustomerFormValues): boolean => {
    const initial = getInitial();
    return (Object.keys(next) as Array<keyof CustomerFormValues>).some(
      (k) => next[k] !== initial[k],
    );
  }, [getInitial]);

  const handleChange = useCallback(
    (field: keyof CustomerFormValues, value: string | MaintenanceType | null) => {
      setFields((prev) => {
        const next = { ...prev, [field]: value };
        setIsDirty(checkDirty(next));
        return next;
      });
      setErrors((prev) => {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [checkDirty],
  );

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

      const ORDER: Array<keyof CustomerFormValues> = [
        'name', 'email', 'phone', 'company', 'address',
        'maintenanceType', 'subscriptionStartDate', 'subscriptionEndDate',
      ];
      setFirstErrorFieldId(ORDER.find((k) => k in fieldErrors) ?? null);
      toast.error(t('customers.messages.validationError'));
      return;
    }

    setErrors({});
    setFirstErrorFieldId(null);
    setIsSubmitting(true);

    try {
      const data = result.data;
      await onSave({
        name:                  data.name,
        email:                 data.email,
        phone:                 data.phone                 || undefined,
        company:               data.company               || undefined,
        address:               data.address               || undefined,
        maintenanceType:       data.maintenanceType       ?? undefined,
        subscriptionStartDate: data.subscriptionStartDate ?? undefined,
        subscriptionEndDate:   data.subscriptionEndDate   ?? undefined,
      } as CreateCustomerData);
      setIsDirty(false);
      toast.success(item ? t('customers.messages.updated') : t('customers.messages.created'));
      onClose();
    } catch {
      toast.error(item ? t('customers.messages.errorUpdate') : t('customers.messages.errorCreate'));
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, t, onSave, onClose, item, toast]);

  return {
    fields, errors, isDirty, firstErrorFieldId,
    isSubmitting, handleChange, handleClear, handleSubmit,
  };
}
