/**
 * ForceDeleteConfirmDialog — type-to-confirm destructive action dialog.
 *
 * Renders its own DialogSheet (Modal-backed). useThemeColors() and useTranslation()
 * are called at the component level, before the Modal renders — safe.
 *
 * ⚠️ Modal safety: hooks are called outside the Modal tree. Do NOT nest inside another Modal.
 *
 * @example
 * <ForceDeleteConfirmDialog
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onConfirm={handleForceDelete}
 *   title="Force Delete User"
 *   message="This will delete all related data."
 *   confirmWord="DELETE"
 *   loading={deleting}
 *   confirmLabel="Delete Everything"
 *   confirmColor="error"
 * />
 *
 * Used in: UsersScreen (force-delete), feature screens requiring type-to-confirm
 * Variants: confirmColor = 'error' | 'warning' | 'primary'
 */
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';
import { DialogSheet, DialogHeader, DialogBanner, DialogTextInput } from './dialog.primitives';
import DialogButton from '@/src/shared/components/actions/DialogButton';

export interface ForceDeleteConfirmDialogProps {
  open:           boolean;
  onClose:        () => void;
  onConfirm:      () => void;
  title?:         string;
  message?:       string;
  confirmWord?:   string;
  loading?:       boolean;
  errorText?:     string;
  confirmLabel?:  string;
  cancelLabel?:   string;
  confirmColor?:  'error' | 'warning' | 'primary';
}

const ICON: Record<string, string> = {
  error:   '🗑️',
  warning: '⚠️',
  primary: '✓',
};

const ForceDeleteConfirmDialog: React.FC<ForceDeleteConfirmDialogProps> = ({
  open, onClose, onConfirm,
  title, message,
  confirmWord = 'DELETE', loading = false,
  errorText, confirmLabel, cancelLabel,
  confirmColor = 'error',
}) => {
  const c = useThemeColors();
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  const isValid = value.trim() === confirmWord;

  // Reset input when dialog closes
  useEffect(() => { if (!open) setValue(''); }, [open]);

  const resolvedTitle        = title        ?? t('common.confirmAction');
  const resolvedConfirmLabel = confirmLabel ?? t('common.delete');
  const resolvedCancelLabel  = cancelLabel  ?? t('common.cancel');

  const confirmBg = confirmColor === 'warning' ? c.intent.warning
                  : confirmColor === 'primary'  ? c.buttons.primary.bg
                  : c.buttons.danger.bg;

  // Green border when typed correctly, default border otherwise
  const inputBorderColor = isValid ? c.intent.success : c.border.secondary;

  return (
    <DialogSheet
      visible={open}
      onClose={onClose}
      lockBackdrop={loading}
      bg={c.surface.primary}
      shadowColor={c.shadow}
      shake={false}
    >
      <DialogHeader
        title={resolvedTitle}
        icon={ICON[confirmColor]}
        iconBg={confirmColor === 'error'   ? c.intent.errorSurface
              : confirmColor === 'warning' ? c.intent.warningSurface
              : c.buttons.primary.bg + '22'}
        iconColor={confirmColor === 'error'   ? c.intent.error
                 : confirmColor === 'warning' ? c.intent.warning
                 : c.buttons.primary.bg}
        titleColor={c.text.primary}
      />

      {!!message && (
        <Text style={{ fontSize: FontSize.md, color: c.text.secondary, marginBottom: 12, lineHeight: 20 }}>
          {message}
        </Text>
      )}

      {!!errorText && (
        <DialogBanner
          message={errorText}
          bg={c.intent.warningSurface}
          borderColor={c.intent.warning + '55'}
          textColor={c.intent.warning}
        />
      )}

      <Text style={{ fontSize: FontSize.sm, color: c.text.muted, marginBottom: 14 }}>
        {t('common.actionDeletesRelatedData')}
      </Text>

      <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text.secondary, marginBottom: 6 }}>
        {t('common.typeToConfirmPrefix')}{' '}
        <Text style={{ fontWeight: FontWeight.extrabold, color: c.intent.error }}>{confirmWord}</Text>
        {' '}{t('common.typeToConfirmSuffix')}
      </Text>

      <DialogTextInput
        value={value}
        onChangeText={setValue}
        placeholder={confirmWord}
        autoCapitalize="characters"
        autoCorrect={false}
        borderColor={inputBorderColor}
        textColor={c.text.primary}
        bg={c.surface.secondary}
        placeholderColor={c.text.muted}
      />

      <View style={{ gap: 10 }}>

        {/* Confirm — colored, disabled until word matches */}
        <DialogButton
          label={loading ? `${resolvedConfirmLabel}…` : resolvedConfirmLabel}
          onPress={onConfirm}
          disabled={!isValid || loading}
          style={{ backgroundColor: confirmBg, opacity: (!isValid || loading) ? 0.45 : 1 }}
          labelStyle={{ color: '#ffffff' }}
        />

        {/* Cancel */}
        <DialogButton
          label={resolvedCancelLabel}
          onPress={onClose}
          disabled={loading}
          icon="close"
          style={{ backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.border.secondary }}
          labelStyle={{ color: c.text.secondary }}
        />

      </View>
    </DialogSheet>
  );
};

export default ForceDeleteConfirmDialog;
