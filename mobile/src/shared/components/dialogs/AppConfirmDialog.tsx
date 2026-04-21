import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, TextInput, type TextInput as TextInputType } from 'react-native';
import AppButton from '../forms/AppButton';

export interface AppConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmWord?: string;
  loading?: boolean;
  errorText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'error' | 'warning' | 'primary';
}

const AppConfirmDialog: React.FC<AppConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message,
  confirmWord = 'DELETE',
  loading = false,
  errorText,
  confirmLabel = 'Delete Related Data',
  cancelLabel = 'Cancel',
  confirmColor = 'error',
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<TextInputType>(null);
  const isValid = value.trim() === confirmWord;

  useEffect(() => {
    if (!open) setValue('');
    else setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-center items-center px-6" onPress={onClose}>
        <Pressable className="bg-white rounded-2xl p-6 w-full max-w-sm" onPress={() => {}}>

          {/* Title */}
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
              <Text className="text-lg">⚠️</Text>
            </View>
            <Text className="text-lg font-bold text-gray-900 flex-1">{title}</Text>
          </View>

          {message && <Text className="text-base text-gray-700 mb-3">{message}</Text>}

          {errorText && (
            <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <Text className="text-sm text-amber-800">⚠️ {errorText}</Text>
            </View>
          )}

          <Text className="text-sm text-gray-400 mb-3">
            This action will also delete related data and cannot be undone.
          </Text>

          {/* Confirm input */}
          <Text className="text-sm font-semibold text-gray-700 mb-1">
            Type {confirmWord} to confirm
          </Text>
          <TextInput
            ref={inputRef}
            className="border-2 border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 mb-5"
            value={value}
            onChangeText={setValue}
            placeholder={confirmWord}
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {/* Actions */}
          <View className="flex-row gap-2">
            <AppButton variant="outlined" color="secondary" onPress={onClose} disabled={loading} fullWidth>
              {cancelLabel}
            </AppButton>
            <AppButton
              variant="contained"
              color={confirmColor}
              onPress={onConfirm}
              disabled={!isValid || loading}
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

export default AppConfirmDialog;
