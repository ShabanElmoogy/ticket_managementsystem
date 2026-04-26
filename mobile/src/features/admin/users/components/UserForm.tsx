import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
import AdminFormPage  from '@/src/features/admin/shared/AdminFormPage';
import AdminFormModal from '@/src/features/admin/shared/AdminFormModal';
import FormField      from '@/src/features/admin/shared/FormField';
import { useFormScroll } from '@/src/features/admin/shared/FormScrollContext';
import { AppTextInput } from '@/src/shared/components';
import { useFocusInput } from '@/src/shared/hooks/useFocusInput';
import { useUserForm } from '../hooks/useUserForm';
import { USER_ROLES, type UserRoleOption } from '../schemas/userSchema';
import { ROLE_CONFIG } from './userColumns';
import type { User, CreateUserData } from '@/src/services/api/types';

interface Props {
  item:       User | null;
  onClose:    () => void;
  onSave:     (data: CreateUserData) => Promise<void>;
  submitting: boolean;
  mode?:      'page' | 'modal';
}

const UserForm: React.FC<Props> = ({
  item, onClose, onSave, submitting, mode = 'page',
}) => {
  const { t }                  = useTranslation();
  const { scrollToFirstError } = useFormScroll();
  const c                      = useThemeColors();

  const {
    fields, errors, isDirty, firstErrorFieldId,
    isSubmitting, handleChange, handleClear, handleSubmit,
  } = useUserForm({ item, onSave, onClose });

  const firstInputRef = useFocusInput({ inModal: mode === 'modal', enabled: true, delay: mode === 'page' ? 100 : undefined });

  // Return-key chain: Name → Email → Password → Phone
  const emailRef    = useRef<TextInput | null>(null);
  const passwordRef = useRef<TextInput | null>(null);
  const phoneRef    = useRef<TextInput | null>(null);

  const onChangeName     = useCallback((v: string) => handleChange('name',     v), [handleChange]);
  const onChangeEmail    = useCallback((v: string) => handleChange('email',    v), [handleChange]);
  const onChangePassword = useCallback((v: string) => handleChange('password', v), [handleChange]);
  const onChangePhone    = useCallback((v: string) => handleChange('phone',    v), [handleChange]);

  const onClearName  = useCallback(() => handleClear('name'),  [handleClear]);
  const onClearEmail = useCallback(() => handleClear('email'), [handleClear]);
  const onClearPhone = useCallback(() => handleClear('phone'), [handleClear]);

  const onSubmit = useCallback(async () => {
    await handleSubmit();
    if (firstErrorFieldId) scrollToFirstError([firstErrorFieldId]);
  }, [handleSubmit, firstErrorFieldId, scrollToFirstError]);

  const formTitle       = item ? t('users.editTitle') : t('users.addTitle');
  const isDisabled      = submitting || isSubmitting;
  const isSubmittingAll = submitting || isSubmitting;

  // Linked stats (edit mode only)
  const assignedTickets = item?._count?.assignedTickets ?? 0;
  const createdTickets  = item?._count?.createdTickets  ?? 0;
  const comments        = item?._count?.comments        ?? 0;

  const fields_jsx = (
    <>
      {/* ── Required fields ── */}
      <FormField fieldId="name">
        <AppTextInput
          inputRef={firstInputRef}
          nextRef={emailRef}
          label={t('users.form.name')}
          value={fields.name}
          onChangeText={onChangeName}
          placeholder={t('users.form.namePlaceholder')}
          error={errors.name}
          autoCapitalize="words"
          maxLength={100}
          showClearButton
          onClear={onClearName}
        />
      </FormField>

      <FormField fieldId="email">
        <AppTextInput
          inputRef={emailRef}
          nextRef={passwordRef}
          label={t('users.form.email')}
          value={fields.email}
          onChangeText={onChangeEmail}
          placeholder={t('users.form.emailPlaceholder')}
          error={errors.email}
          fieldType="email"
          maxLength={150}
          showClearButton
          onClear={onClearEmail}
        />
      </FormField>

      <FormField fieldId="password">
        <AppTextInput
          inputRef={passwordRef}
          nextRef={phoneRef}
          label={item ? t('users.form.passwordEdit') : t('users.form.password')}
          value={fields.password}
          onChangeText={onChangePassword}
          placeholder={t('users.form.passwordPlaceholder')}
          error={errors.password}
          fieldType="password"
          maxLength={100}
        />
      </FormField>

      <FormField fieldId="phone">
        <AppTextInput
          inputRef={phoneRef}
          label={t('users.form.phone')}
          value={fields.phone}
          onChangeText={onChangePhone}
          placeholder={t('users.form.phonePlaceholder')}
          error={errors.phone}
          maxLength={30}
          showClearButton
          onClear={onClearPhone}
          blurOnSubmit
        />
      </FormField>

      {/* ── Role selector ── */}
      <FormField fieldId="role">
        <RoleSelector
          value={fields.role}
          onChange={(v) => handleChange('role', v)}
          t={t}
        />
      </FormField>

      {/* ── Linked stats (edit mode only) ── */}
      {item && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: c.intent.infoSurface, borderWidth: 1, borderColor: c.border.secondary, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: c.intent.info }}>{assignedTickets}</Text>
            <Text style={{ fontSize: 11, color: c.intent.info, marginTop: 2 }}>{t('users.detail.assignedTickets')}</Text>
          </View>
          <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: c.intent.successSurface, borderWidth: 1, borderColor: c.border.secondary, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: c.intent.success }}>{createdTickets}</Text>
            <Text style={{ fontSize: 11, color: c.intent.success, marginTop: 2 }}>{t('users.detail.createdTickets')}</Text>
          </View>
          <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: c.intent.warningSurface, borderWidth: 1, borderColor: c.border.secondary, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: c.intent.warning }}>{comments}</Text>
            <Text style={{ fontSize: 11, color: c.intent.warning, marginTop: 2 }}>{t('users.detail.comments')}</Text>
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

// ── Role selector ─────────────────────────────────────────────────────────────

interface SelectorProps {
  value:    UserRoleOption;
  onChange: (v: UserRoleOption) => void;
  t:        (key: string) => string;
}

const RoleSelector: React.FC<SelectorProps> = ({ value, onChange, t }) => {
  const c = useThemeColors();

  const ROLE_LABELS: Record<UserRoleOption, string> = {
    SUPER_ADMIN:  t('users.roles.superAdmin'),
    TENANT_ADMIN: t('users.roles.tenantAdmin'),
    EMPLOYEE:     t('users.roles.employee'),
    PROGRAMMER:   t('users.roles.programmer'),
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: c.text.secondary }}>
        {t('users.columns.role')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {USER_ROLES.map((role) => {
          const cfg     = ROLE_CONFIG[role];
          const isActive = value === role;
          return (
            <Pressable
              key={role}
              onPress={() => onChange(role)}
              style={{
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
                borderWidth: 1.5,
                borderColor: isActive ? cfg.color : c.border.primary,
                backgroundColor: isActive ? cfg.bg : c.surface.primary,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? cfg.color : c.text.secondary }}>
                {ROLE_LABELS[role]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default UserForm;
