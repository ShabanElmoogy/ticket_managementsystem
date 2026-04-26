import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createUserFormSchema, USER_ROLES, type UserRoleOption } from '@/src/features/admin/users/schemas/userSchema';
import { useToast } from '@/src/shared/hooks/useToast';
import type { User, CreateUserData } from '@/src/services/api/types';

export interface UserFormFields {
  name:     string;
  email:    string;
  password: string;
  phone:    string;
  role:     UserRoleOption;
}

export interface UseUserFormReturn {
  fields:            UserFormFields;
  errors:            Record<string, string>;
  isDirty:           boolean;
  firstErrorFieldId: string | null;
  isSubmitting:      boolean;
  handleChange:      (field: keyof UserFormFields, value: string) => void;
  handleClear:       (field: keyof UserFormFields) => void;
  handleSubmit:      () => Promise<void>;
}

interface Args {
  item:    User | null;
  onSave:  (data: CreateUserData) => Promise<void>;
  onClose: () => void;
}

export function useUserForm({ item, onSave, onClose }: Args): UseUserFormReturn {
  const { t } = useTranslation();
  const toast = useToast();
  const isEdit = !!item;

  const getInitial = useCallback((): UserFormFields => ({
    name:     item?.name  ?? '',
    email:    item?.email ?? '',
    password: '',
    phone:    item?.phone ?? '',
    role:     (item?.role as UserRoleOption) ?? 'EMPLOYEE',
  }), [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [fields,            setFields]            = useState<UserFormFields>(getInitial);
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

  const checkDirty = useCallback((next: UserFormFields): boolean => {
    const initial = getInitial();
    return (Object.keys(next) as Array<keyof UserFormFields>).some(
      (k) => next[k] !== initial[k],
    );
  }, [getInitial]);

  const handleChange = useCallback(
    (field: keyof UserFormFields, value: string) => {
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
    (field: keyof UserFormFields) => handleChange(field, ''),
    [handleChange],
  );

  const handleSubmit = useCallback(async () => {
    const schema = createUserFormSchema(t, isEdit);
    const result = schema.safeParse(fields);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? '');
        if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);

      const ORDER: Array<keyof UserFormFields> = ['name', 'email', 'password', 'phone', 'role'];
      setFirstErrorFieldId(ORDER.find((k) => k in fieldErrors) ?? null);
      toast.error(t('users.messages.validationError'));
      return;
    }

    setErrors({});
    setFirstErrorFieldId(null);
    setIsSubmitting(true);

    try {
      const data = result.data;
      const payload: CreateUserData = {
        name:  data.name,
        email: data.email,
        // On edit: omit password entirely when blank — backend treats absence as "no change"
        // On create: password is required and validated min(6) by schema
        ...(data.password ? { password: data.password } : isEdit ? {} : { password: '' }),
        phone: data.phone || undefined,
        role:  data.role,
      };
      await onSave(payload);
      setIsDirty(false);
      toast.success(isEdit ? t('users.messages.updated') : t('users.messages.created'));
      onClose();
    } catch {
      toast.error(isEdit ? t('users.messages.errorUpdate') : t('users.messages.errorCreate'));
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, t, isEdit, onSave, onClose, toast]);

  return {
    fields, errors, isDirty, firstErrorFieldId,
    isSubmitting, handleChange, handleClear, handleSubmit,
  };
}
