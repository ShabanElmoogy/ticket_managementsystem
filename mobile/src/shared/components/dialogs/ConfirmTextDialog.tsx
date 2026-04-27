import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';
import { DialogSheet, DialogHeader, DialogBanner, DialogTextInput } from './dialog.primitives';
import DialogButton from '@/src/shared/components/actions/DialogButton';

export interface ConfirmTextDialogProps {
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

const ConfirmTextDialog: React.FC<ConfirmTextDialogProps> = ({
  open, onClose, onConfirm,
  title = 'Confirm Action', message,
  confirmWord = 'DELETE', loading = false,
  errorText, confirmLabel = 'Delete Related Data',
  cancelLabel = 'Cancel', confirmColor = 'error',
}) => {
  const c = useThemeColors();
  const [value, setValue] = useState('');
  const isValid = value.trim() === confirmWord;

  useEffect(() => { if (!open) setValue(''); }, [open]);

  const confirmBg = confirmColor === 'warning' ? c.interactive.warning
                  : confirmColor === 'primary'  ? c.buttons.primary.bg
                  : c.buttons.danger.bg;

  return (
    <DialogSheet
      visible={open}
      onClose={onClose}
      bg={c.surface.primary}
      shadowColor={c.shadow}
      shake={false}
    >
      <DialogHeader
        title={title}
        iconBg={c.intent.errorSurface}
        iconColor={c.intent.error}
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
        This action will also delete related data and cannot be undone.
      </Text>

      <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text.secondary, marginBottom: 6 }}>
        {'Type '}
        <Text style={{ fontWeight: FontWeight.extrabold, color: c.intent.error }}>{confirmWord}</Text>
        {' to confirm'}
      </Text>

      <DialogTextInput
        value={value}
        onChangeText={setValue}
        placeholder={confirmWord}
        autoCapitalize="characters"
        autoCorrect={false}
        borderColor={isValid ? c.intent.error : c.border.secondary}
        textColor={c.text.primary}
        bg={c.surface.secondary}
        placeholderColor={c.text.muted}
      />

      <View style={{ gap: 10 }}>
        <DialogButton
          label={loading ? `${confirmLabel}…` : confirmLabel}
          onPress={onConfirm}
          disabled={!isValid || loading}
          style={{ backgroundColor: confirmBg }}
          labelStyle={{ color: c.text.inverse }}
        />
        <DialogButton
          label={cancelLabel}
          onPress={onClose}
          disabled={loading}
          icon="close"
          iconColor={c.text.secondary}
          style={{ backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.border.secondary }}
          labelStyle={{ color: c.text.secondary }}
        />
      </View>
    </DialogSheet>
  );
};

export default ConfirmTextDialog;
