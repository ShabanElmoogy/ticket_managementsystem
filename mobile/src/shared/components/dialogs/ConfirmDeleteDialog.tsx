import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors, FontSize } from '@/src/constants/theme';
import { DialogSheet, DialogHeader, DialogBanner, DialogProgressBar } from './dialog.primitives';
import DialogButton from '@/src/shared/components/actions/DialogButton';

export interface ConfirmDeleteDialogProps {
  open:             boolean;
  onClose:          () => void;
  onConfirm:        () => void;
  title?:           string;
  message?:         string;
  itemName?:        string;
  itemType?:        string;
  loading?:         boolean;
  warningMessage?:  string;
  softDeleteLabel?: string;
  onSoftDelete?:    () => void;
  confirmLabel?:    string;
  cancelLabel?:     string;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open, onClose, onConfirm,
  title, message, itemName, itemType,
  loading = false, warningMessage,
  softDeleteLabel, onSoftDelete,
  confirmLabel, cancelLabel,
}) => {
  const c = useThemeColors();
  const { t } = useTranslation();

  const resolvedItemType     = itemType     ?? t('common.item');
  const resolvedConfirmLabel = confirmLabel ?? t('common.delete');
  const resolvedCancelLabel  = cancelLabel  ?? t('common.cancel');

  const resolvedMessage = message
    ?? (itemName
      ? t('common.deleteConfirmNamed',   { name: itemName, type: resolvedItemType })
      : t('common.deleteConfirmGeneric', { type: resolvedItemType }));

  return (
    <DialogSheet
      visible={open}
      onClose={onClose}
      lockBackdrop={loading}
      bg={c.surface.primary}
      shadowColor={c.shadow}
      shake
    >
      <DialogHeader
        title={loading ? t('common.deleting') : (title ?? t('common.deleteTitle', { type: resolvedItemType }))}
        icon="🗑️"
        loading={loading}
        iconBg={c.intent.errorSurface}
        iconColor={c.intent.error}
        titleColor={c.text.primary}
      />

      {!loading && (
        <>
          <Text style={{ fontSize: FontSize.base, color: c.text.secondary, marginBottom: 12, lineHeight: 20 }}>
            {resolvedMessage}
          </Text>

          {!!warningMessage && (
            <DialogBanner
              message={warningMessage}
              bg={c.intent.warningSurface}
              borderColor={c.intent.warning + '55'}
              textColor={c.intent.warning}
            />
          )}

          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, marginBottom: 16 }}>
            {t('common.actionCannotBeUndone')}
          </Text>
        </>
      )}

      {loading && <DialogProgressBar color={c.buttons.danger.bg} />}

      <View style={{ gap: 10, marginTop: loading ? 4 : 0 }}>

        {/* Soft delete — amber (optional, full width above row) */}
        {!loading && !!(softDeleteLabel && onSoftDelete) && (
          <DialogButton
            label={softDeleteLabel}
            onPress={onSoftDelete}
            icon="archive"
            style={{ backgroundColor: c.intent.warning }}
            labelStyle={{ color: '#ffffff' }}
          />
        )}

        {/* Cancel + Delete — side by side */}
        <View style={{ flexDirection: 'row', gap: 10 }}>

          {/* Cancel */}
          <DialogButton
            label={resolvedCancelLabel}
            onPress={onClose}
            disabled={loading}
            icon="close"
            style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.border.secondary }}
            labelStyle={{ color: c.text.secondary }}
          />

          {/* Confirm delete — red */}
          <DialogButton
            label={loading ? t('common.deleting') : resolvedConfirmLabel}
            onPress={onConfirm}
            disabled={loading}
            icon={loading ? undefined : 'delete'}
            style={{ flex: 1, backgroundColor: c.buttons.danger.bg }}
            labelStyle={{ color: c.buttons.danger.text }}
          />

        </View>
      </View>
    </DialogSheet>
  );
};

export default ConfirmDeleteDialog;
