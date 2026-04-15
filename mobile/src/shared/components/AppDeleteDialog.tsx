import React from 'react';
import { Modal, View, Text, Pressable, useColorScheme } from 'react-native';
import AppButton from './AppButton';

export interface AppDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  itemType?: string;
  loading?: boolean;
  warningMessage?: string;
  softDeleteLabel?: string;
  onSoftDelete?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const AppDeleteDialog: React.FC<AppDeleteDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  itemType = 'item',
  loading = false,
  warningMessage,
  softDeleteLabel,
  onSoftDelete,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const defaultTitle   = `Delete ${itemType}`;
  const defaultMessage = itemName
    ? `Are you sure you want to delete "${itemName}"?`
    : `Are you sure you want to delete this ${itemType}?`;

  const hasSoftDelete = !!(softDeleteLabel && onSoftDelete);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center px-5"
        onPress={onClose}
      >
        <Pressable
          className={`rounded-2xl p-5 w-full max-w-sm ${isDark ? 'bg-slate-800' : 'bg-white'}`}
          style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 }}
          onPress={() => {}}
        >
          {/* Title row */}
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center shrink-0">
              <Text className="text-lg">⚠️</Text>
            </View>
            <Text className={`text-base font-bold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title ?? defaultTitle}
            </Text>
          </View>

          {/* Body */}
          <Text className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {message ?? defaultMessage}
          </Text>

          {warningMessage && (
            <View className={`rounded-lg p-3 mb-3 ${isDark ? 'bg-amber-900/30 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
              <Text className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                ⚠️ {warningMessage}
              </Text>
            </View>
          )}

          <Text className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            This action cannot be undone.
          </Text>

          {/* Actions — stacked vertically to prevent overflow */}
          <View className="gap-2">
            {/* Delete button — primary action, full width on top */}
            <AppButton
              variant="contained"
              color="error"
              onPress={onConfirm}
              loading={loading}
              loadingText={`${confirmLabel}ing…`}
              fullWidth
            >
              {confirmLabel}
            </AppButton>

            {/* Soft delete option */}
            {hasSoftDelete && (
              <AppButton
                variant="outlined"
                color="warning"
                onPress={onSoftDelete}
                disabled={loading}
                fullWidth
              >
                {softDeleteLabel}
              </AppButton>
            )}

            {/* Cancel — secondary, below */}
            <AppButton
              variant="text"
              color="secondary"
              onPress={onClose}
              disabled={loading}
              fullWidth
            >
              {cancelLabel}
            </AppButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AppDeleteDialog;
