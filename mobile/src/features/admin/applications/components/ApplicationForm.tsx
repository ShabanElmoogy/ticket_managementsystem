/**
 * ApplicationForm.tsx
 *
 * Follows the unified form pattern (mobile-form-pattern.md).
 * Reference: CustomerForm.tsx
 *
 * - RHF + zodResolver (no manual useState form state)
 * - AppFormField for all text inputs
 * - FormSection grouping
 * - AdminFormPage with form= prop (dirty tracking, discard guard, scroll-to-error)
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Palette, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import AdminFormPage  from '@/src/features/admin/shared/AdminFormPage';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormSection    from '@/src/shared/components/forms/FormSection';
import { AppTextInput, AppFormField } from '@/src/shared/components';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import { useToast } from '@/src/shared/hooks/useToast';
import { networkEvents } from '@/src/services/api/networkEvents';
import { createApplicationFormSchema } from '../schemas/applicationSchema';
import type { Application, CreateApplicationData } from '@/src/services/api/types';

// ── Linked stat config ────────────────────────────────────────────────────────

const STAT_DEFS = [
  { key: 'tickets'   as const, labelKey: 'applications.columns.tickets',   color: Palette.blue700,  bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'customers' as const, labelKey: 'applications.columns.customers', color: Palette.green700, bg: '#f0fdf4', border: '#bbf7d0' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  item:       Application | null;
  onClose:    () => void;
  onSave:     (data: CreateApplicationData) => Promise<void>;
  submitting: boolean;
  mode?:      'page' | 'modal';
}

// ── Component ─────────────────────────────────────────────────────────────────

const ApplicationForm: React.FC<Props> = ({ item, onClose, onSave, submitting, mode = 'page' }) => {
  const { t }  = useTranslation();
  const toast  = useToast();
  const isEdit = !!item;

  // ── Duplicate detection ────────────────────────────────────────────────────
  const isDuplicateError = useRef(false);

  useEffect(() => {
    const unsub = networkEvents.onOkPress(() => {
      if (isDuplicateError.current) {
        isDuplicateError.current = false;
        onClose();
      }
    });
    return () => { unsub(); };
  }, [onClose]);

  // ── RHF setup ──────────────────────────────────────────────────────────────
  const form = useForm({
    resolver: zodResolver(createApplicationFormSchema(t)),
    mode: 'onBlur',
    defaultValues: {
      name:        item?.name        ?? '',
      version:     item?.version     ?? '',
      description: item?.description ?? '',
    },
  });

  const { control, handleSubmit, formState: { isSubmitting, errors } } = form;

  // ── Keyboard chain ─────────────────────────────────────────────────────────
  const firstInputRef  = useFocusInput({ inModal: mode === 'modal', enabled: true, delay: mode === 'page' ? 100 : undefined });
  const versionRef     = useRef<any>(null);
  const descriptionRef = useRef<any>(null);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const doSave = async (data: any) => {
    try {
      await onSave({
        name:        data.name,
        version:     data.version     || undefined,
        description: data.description || undefined,
      } as CreateApplicationData);

      // ✅ Toast BEFORE onClose — component unmounts on close
      toast.success(isEdit ? t('applications.messages.updated') : t('applications.messages.created'));
      onClose();

    } catch (err: any) {
      const serverMsg: string =
        err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';

      if (serverMsg.toLowerCase().includes('already exists')) {
        isDuplicateError.current = true;
        toast.error(t('applications.duplicateError.title'), t('applications.duplicateError.message'));
        return;
      }
      // All other errors: NetworkErrorDialog handles automatically
    }
  };

  const formTitle  = isEdit ? t('applications.editTitle') : t('applications.addTitle');
  const isDisabled = submitting || isSubmitting;

  // ── Fields JSX ─────────────────────────────────────────────────────────────
  const fields_jsx = (
    <>
      {/* Required */}
      <FormSection
        title={t('applications.sections.info')}
        icon="📱"
        hasError={!!(errors.name || errors.version)}
      >
        <AppFormField name="name" control={control}>
          <AppTextInput
            inputRef={firstInputRef}
            nextRef={versionRef}
            label={t('applications.form.name')}
            placeholder={t('applications.form.namePlaceholder')}
            required
            autoCapitalize="words"
            maxLength={100}
            showClearButton
          />
        </AppFormField>

        <AppFormField name="version" control={control}>
          <AppTextInput
            inputRef={versionRef}
            nextRef={descriptionRef}
            label={t('applications.form.version')}
            placeholder={t('applications.form.versionPlaceholder')}
            autoCapitalize="none"
            maxLength={50}
            showClearButton
          />
        </AppFormField>
      </FormSection>

      {/* Optional description */}
      <FormSection
        title={t('applications.sections.description')}
        icon="📝"
        collapsible
        defaultCollapsed={!item?.description}
        last={!item}
        hasError={!!errors.description}
      >
        <AppFormField name="description" control={control}>
          <AppTextInput
            inputRef={descriptionRef}
            label={t('applications.form.description')}
            placeholder={t('applications.form.descriptionPlaceholder')}
            autoCapitalize="sentences"
            maxLength={500}
            showClearButton
            multiline
            numberOfLines={3}
            blurOnSubmit
          />
        </AppFormField>
      </FormSection>

      {/* Linked stats — edit mode only */}
      {item && (
        <View style={styles.statsRow}>
          {STAT_DEFS.map((def) => (
            <View key={def.key} style={[styles.statCard, { backgroundColor: def.bg, borderColor: def.border }]}>
              <Text style={[styles.statValue, { color: def.color }]}>
                {item._count?.[def.key] ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: def.color }]}>
                {t(def.labelKey)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  if (mode === 'page') {
    return (
      <AdminFormPage
        title={formTitle}
        onBack={onClose}
        onSubmit={doSave}
        submitting={isDisabled}
        form={form}
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
      onSubmit={handleSubmit(doSave)}
      submitting={isDisabled}
      submitLabel={t('common.save')}
    >
      {fields_jsx}
    </AdminFormModal>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  statsRow:  { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:  { flex: 1, padding: 14, borderRadius: Radius.xl, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, marginTop: 3, fontWeight: FontWeight.medium, textAlign: 'center' },
});

export default ApplicationForm;
