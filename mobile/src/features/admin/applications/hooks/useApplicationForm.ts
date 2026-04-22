import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createApplicationFormSchema } from '../schemas/applicationSchema';
import type { Application, CreateApplicationData } from '@/src/services/api/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApplicationFormValues {
  name:        string;
  description: string;
  version:     string;
}

export interface UseApplicationFormReturn {
  fields:            ApplicationFormValues;
  errors:            Record<string, string>;
  isDirty:           boolean;
  firstErrorFieldId: string | null;
  isSubmitting:      boolean;
  handleChange:      (field: keyof ApplicationFormValues, value: string) => void;
  handleClear:       (field: keyof ApplicationFormValues) => void;
  handleSubmit:      () => Promise<void>;
}

interface UseApplicationFormArgs {
  item:    Application | null;
  onSave:  (data: CreateApplicationData) => Promise<void>;
  onClose: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useApplicationForm — all state, validation, and submit logic for ApplicationForm.
 *
 * Fixes:
 * - State syncs when `item` changes (useEffect on item.id)
 * - Errors deleted (not set to '') on field change
 * - isDirty tracks whether any field differs from initial values
 * - firstErrorFieldId exposed for scrollToFirstError integration
 * - All handlers stable via useCallback
 */
export function useApplicationForm({
  item,
  onSave,
  onClose,
}: UseApplicationFormArgs): UseApplicationFormReturn {
  const { t } = useTranslation();

  // ── Initial values ────────────────────────────────────────────────────────
  const getInitial = useCallback(
    (): ApplicationFormValues => ({
      name:        item?.name        ?? '',
      description: item?.description ?? '',
      version:     item?.version     ?? '',
    }),
    // Re-derive only when the item identity changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item?.id],
  );

  const [fields,            setFields]            = useState<ApplicationFormValues>(getInitial);
  const [errors,            setErrors]            = useState<Record<string, string>>({});
  const [isDirty,           setIsDirty]           = useState(false);
  const [isSubmitting,      setIsSubmitting]      = useState(false);
  const [firstErrorFieldId, setFirstErrorFieldId] = useState<string | null>(null);

  // ── Sync state when item changes (modal re-opened with different item) ────
  useEffect(() => {
    setFields(getInitial());
    setErrors({});
    setIsDirty(false);
    setFirstErrorFieldId(null);
  }, [getInitial]);

  // ── Dirty check ───────────────────────────────────────────────────────────
  const checkDirty = useCallback(
    (next: ApplicationFormValues): boolean => {
      const initial = getInitial();
      return (
        next.name        !== initial.name        ||
        next.description !== initial.description ||
        next.version     !== initial.version
      );
    },
    [getInitial],
  );

  // ── handleChange ──────────────────────────────────────────────────────────
  const handleChange = useCallback(
    (field: keyof ApplicationFormValues, value: string) => {
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
    },
    [checkDirty],
  );

  // ── handleClear ───────────────────────────────────────────────────────────
  const handleClear = useCallback(
    (field: keyof ApplicationFormValues) => handleChange(field, ''),
    [handleChange],
  );

  // ── handleSubmit ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const result = createApplicationFormSchema(t).safeParse(fields);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? '');
        if (key && !(key in fieldErrors)) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);

      // First error in visual order
      const ORDER: Array<keyof ApplicationFormValues> = ['name', 'version', 'description'];
      setFirstErrorFieldId(ORDER.find((k) => k in fieldErrors) ?? null);
      return;
    }

    setErrors({});
    setFirstErrorFieldId(null);
    setIsSubmitting(true);

    try {
      await onSave({
        name:        result.data.name,
        description: result.data.description || undefined,
        version:     result.data.version     || undefined,
      });
      setIsDirty(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, t, onSave, onClose]);

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
