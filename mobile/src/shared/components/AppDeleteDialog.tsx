import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
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
  const defaultTitle   = `Delete ${itemType}`;
  const defaultMessage = itemName
    ? `Are you sure you want to delete "${itemName}"?`
    : `Are you sure you want to delete this ${itemType}?`;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-center items-center px-6" onPress={onClose}>
        <Pressable className="bg-white rounded-2xl p-6 w-full max-w-sm" onPress={() => {}}>

          {/* Title */}
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
              <Text className="text-lg">⚠️</Text>
            </View>
            <Text className="text-lg font-bold text-gray-900 flex-1">
              {title ?? defaultTitle}
            </Text>
          </View>

          {/* Body */}
          <Text className="text-base text-gray-700 mb-3">{message ?? defaultMessage}</Text>

          {warningMessage && (
            <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <Text className="text-sm text-amber-800">⚠️ {warningMessage}</Text>
            </View>
          )}

          <Text className="text-sm text-gray-400 mb-5">This action cannot be undone.</Text>

          {/* Actions */}
          <View className="flex-row gap-2">
            <AppButton
              variant="outlined"
              color="secondary"
              onPress={onClose}
              disabled={loading}
              fullWidth
            >
              {cancelLabel}
            </AppButton>

            {softDeleteLabel && onSoftDelete && (
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
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AppDeleteDialog;
