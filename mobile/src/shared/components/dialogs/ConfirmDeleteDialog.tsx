import React from 'react';
import { View, Text } from 'react-native';
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
  title, message, itemName, itemType = 'item',
  loading = false, warningMessage,
  softDeleteLabel, onSoftDelete,
  confirmLabel = 'Delete', cancelLabel = 'Cancel',
}) => {
  const c = useThemeColors();

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
        title={loading ? 'Deleting…' : (title ?? `Delete ${itemType}`)}
        loading={loading}
        iconBg={c.intent.errorSurface}
        iconColor={c.intent.error}
        titleColor={c.text.primary}
      />

      {!loading && (
        <>
          <Text style={{ fontSize: FontSize.base, color: c.text.secondary, marginBottom: 12, lineHeight: 20 }}>
            {message ?? (itemName
              ? `Are you sure you want to delete "${itemName}"?`
              : `Are you sure you want to delete this ${itemType}?`)}
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
            This action cannot be undone.
          </Text>
        </>
      )}

      {loading && <DialogProgressBar color={c.buttons.danger.bg} />}

      <View style={{ gap: 10, marginTop: loading ? 4 : 0 }}>
        <DialogButton
          label={loading ? 'Deleting…' : confirmLabel}
          onPress={onConfirm}
          disabled={loading}
          icon={loading ? undefined : 'delete'}
          iconColor={c.buttons.danger.text}
          style={{ backgroundColor: c.buttons.danger.bg }}
          labelStyle={{ color: c.buttons.danger.text }}
        />

        {!loading && !!(softDeleteLabel && onSoftDelete) && (
          <DialogButton
            label={softDeleteLabel}
            onPress={onSoftDelete}
            disabled={loading}
            icon="archive"
            iconColor={c.text.inverse}
            style={{ backgroundColor: c.interactive.warning }}
            labelStyle={{ color: c.text.inverse }}
          />
        )}

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

export default ConfirmDeleteDialog;
