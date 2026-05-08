/**
 * UserForm.tsx
 *
 * Follows the unified form pattern (mobile-form-pattern.md).
 * Reference: CustomerForm.tsx
 *
 * - RHF + zodResolver (no manual useState form state)
 * - AppFormField for all text inputs
 * - Controller for role ChipSelector
 * - FormSection grouping
 * - Duplicate email detection + specific toast
 * - AdminFormPage with form= prop (dirty tracking, discard guard, scroll-to-error)
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Palette, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import AdminFormPage  from '@/src/features/admin/shared/AdminFormPage';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormSection    from '@/src/shared/components/forms/FormSection';
import ChipSelector   from '@/src/shared/components/forms/ChipSelector';
import { AppTextInput, AppFormField } from '@/src/shared/components';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import { useToast } from '@/src/shared/hooks/useToast';
import { networkEvents } from '@/src/services/api/networkEvents';
import { createUserFormSchema, USER_ROLES, type UserRoleOption } from '../schemas/userSchema';
import { ROLE_CONFIG } from './userColumns';
import type { User, CreateUserData } from '@/src/services/api/types';

// ── Role options for ChipSelector ─────────────────────────────────────────────

const ROLE_OPTIONS = USER_ROLES.map((role) => ({
  value:       role,
  label:       ROLE_CONFIG[role]?.label ?? role,
  color:       ROLE_CONFIG[role]?.color,
  bgColor:     ROLE_CONFIG[role]?.bg,
}));

// ── Linked stat config ────────────────────────────────────────────────────────

const STAT_DEFS = [
  { key: 'assignedTickets' as const, labelKey: 'users.detail.assignedTickets', color: Palette.blue700,  bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'createdTickets'  as const, labelKey: 'users.detail.createdTickets',  color: Palette.green700, bg: '#f0fdf4', border: '#bbf7d0' },
  { key: 'comments'        as const, labelKey: 'users.detail.comments',        color: Palette.violet600, bg: '#f5f3ff', border: '#ddd6fe' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  item:       User | null;
  onClose:    () => void;
  onSave:     (data: CreateUserData) => Promise<void>;
  submitting: boolean;
  mode?:      'page' | 'modal';
}

// ── Component ─────────────────────────────────────────────────────────────────

const UserForm: React.FC<Props> = ({ item, onClose, onSave, submitting, mode = 'page' }) => {
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
    resolver: zodResolver(createUserFormSchema(t, isEdit)),
    mode: 'onBlur',
    defaultValues: {
      name:     item?.name  ?? '',
      email:    item?.email ?? '',
      password: '',
      phone:    item?.phone ?? '',
      role:     (item?.role as UserRoleOption) ?? 'EMPLOYEE',
    },
  });

  const { control, handleSubmit, formState: { isSubmitting, errors } } = form;

  // ── Keyboard chain ─────────────────────────────────────────────────────────
  const firstInputRef = useFocusInput({ inModal: mode === 'modal', enabled: true, delay: mode === 'page' ? 100 : undefined });
  const emailRef      = useRef<any>(null);
  const passwordRef   = useRef<any>(null);
  const phoneRef      = useRef<any>(null);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const doSave = async (data: any) => {
    try {
      await onSave({
        name:     data.name,
        email:    data.email,
        // On edit: omit password when blank — backend treats absence as "no change"
        ...(data.password ? { password: data.password } : isEdit ? {} : { password: '' }),
        phone:    data.phone || undefined,
        role:     data.role,
      } as CreateUserData);

      // ✅ Toast BEFORE onClose — component unmounts on close
      toast.success(isEdit ? t('users.messages.updated') : t('users.messages.created'));
      onClose();

    } catch (err: any) {
      const serverMsg: string =
        err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? '';

      if (serverMsg.toLowerCase().includes('already exists')) {
        isDuplicateError.current = true;
        toast.error(t('users.duplicateError.title'), t('users.duplicateError.message'));
        return;
      }
      // Re-throw so react-hook-form resets isSubmitting → button becomes active again
      throw err;
    }
  };

  const formTitle  = isEdit ? t('users.editTitle') : t('users.addTitle');
  const isDisabled = submitting || isSubmitting;

  // ── Fields JSX ─────────────────────────────────────────────────────────────
  const fields_jsx = (
    <>
      {/* Required fields */}
      <FormSection
        title={t('users.sections.account')}
        icon="👤"
        hasError={!!(errors.name || errors.email || errors.password)}
      >
        <AppFormField name="name" control={control}>
          <AppTextInput
            inputRef={firstInputRef}
            nextRef={emailRef}
            label={t('users.form.name')}
            placeholder={t('users.form.namePlaceholder')}
            required
            autoCapitalize="words"
            maxLength={100}
            showClearButton
          />
        </AppFormField>

        <AppFormField name="email" control={control}>
          <AppTextInput
            inputRef={emailRef}
            nextRef={passwordRef}
            label={t('users.form.email')}
            placeholder={t('users.form.emailPlaceholder')}
            required
            fieldType="email"
            maxLength={150}
            showClearButton
          />
        </AppFormField>

        <AppFormField name="password" control={control}>
          <AppTextInput
            inputRef={passwordRef}
            nextRef={phoneRef}
            label={isEdit ? t('users.form.passwordEdit') : t('users.form.password')}
            placeholder={t('users.form.passwordPlaceholder')}
            fieldType="password"
            maxLength={100}
            required={!isEdit}
          />
        </AppFormField>
      </FormSection>

      {/* Optional contact */}
      <FormSection
        title={t('users.sections.contact')}
        icon="📞"
        collapsible
        hasError={!!errors.phone}
      >
        <AppFormField name="phone" control={control}>
          <AppTextInput
            inputRef={phoneRef}
            label={t('users.form.phone')}
            placeholder={t('users.form.phonePlaceholder')}
            maxLength={30}
            keyboardType="phone-pad"
            showClearButton
            blurOnSubmit
          />
        </AppFormField>
      </FormSection>

      {/* Role — ChipSelector via Controller */}
      <FormSection
        title={t('users.sections.role')}
        icon="🔑"
        last={!item}
        hasError={!!errors.role}
      >
        <Controller
          name="role"
          control={control}
          render={({ field: { value, onChange } }) => (
            <ChipSelector
              label={t('users.columns.role')}
              options={ROLE_OPTIONS}
              value={value}
              onChange={onChange}
            />
          )}
        />
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
  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard:  { flex: 1, padding: 12, borderRadius: Radius.xl, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, marginTop: 3, fontWeight: FontWeight.medium, textAlign: 'center' },
});

export default UserForm;
