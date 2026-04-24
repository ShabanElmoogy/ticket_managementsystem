import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import AppButton from '../forms/AppButton';
import { useThemeColors, Radius, FontSize, FontWeight, Palette } from '../../../constants/theme';

export interface AppDeleteDialogProps {
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

const AppDeleteDialog: React.FC<AppDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  itemType      = 'item',
  loading       = false,
  warningMessage,
  softDeleteLabel,
  onSoftDelete,
  confirmLabel  = 'Delete',
  cancelLabel   = 'Cancel',
}) => {
  const c = useThemeColors();
  const hasSoftDelete = !!(softDeleteLabel && onSoftDelete);

  const defaultTitle   = `Delete ${itemType}`;
  const defaultMessage = itemName
    ? `Are you sure you want to delete "${itemName}"?`
    : `Are you sure you want to delete this ${itemType}?`;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: c.surface.primary,
            borderRadius:    Radius['2xl'],
            padding:         20,
            width:           '100%',
            maxWidth:        400,
            shadowColor:     c.shadow,
            shadowOffset:    { width: 0, height: 4 },
            shadowOpacity:   0.2,
            shadowRadius:    12,
            elevation:       8,
          }}
          onPress={() => {}}
        >
          {/* ── Title row ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{
              width: 40, height: 40, borderRadius: Radius.full,
              backgroundColor: c.intent.errorSurface,
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Text style={{ fontSize: FontSize['2xl'] }}>⚠️</Text>
            </View>
            <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text.primary, flex: 1 }}>
              {title ?? defaultTitle}
            </Text>
          </View>

          {/* ── Body ── */}
          <Text style={{ fontSize: FontSize.base, color: c.text.secondary, marginBottom: 12, lineHeight: 20 }}>
            {message ?? defaultMessage}
          </Text>

          {/* ── Warning banner ── */}
          {warningMessage && (
            <View style={{
              backgroundColor: c.intent.warningSurface,
              borderWidth: 1, borderColor: c.intent.warning + '55',
              borderRadius: Radius.md, padding: 12, marginBottom: 12,
            }}>
              <Text style={{ fontSize: FontSize.xs, color: c.intent.warning }}>
                ⚠️  {warningMessage}
              </Text>
            </View>
          )}

          {/* ── Irreversible note ── */}
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, marginBottom: 16 }}>
            This action cannot be undone.
          </Text>

          {/* ── Actions — stacked vertically ── */}
          <View style={{ gap: 8 }}>
            <AppButton variant="contained" color="error" onPress={onConfirm} loading={loading} loadingText={`${confirmLabel}ing…`} fullWidth>
              {confirmLabel}
            </AppButton>

            {hasSoftDelete && (
              <AppButton variant="outlined" color="warning" onPress={onSoftDelete} disabled={loading} fullWidth>
                {softDeleteLabel}
              </AppButton>
            )}

            <AppButton variant="outlined" color="secondary" onPress={onClose} disabled={loading} fullWidth>
              {cancelLabel}
            </AppButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AppDeleteDialog;
