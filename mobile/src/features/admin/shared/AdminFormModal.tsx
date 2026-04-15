import React from 'react';
import {
  Modal, View, Text, Pressable, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AppButton from '../../../shared/components/AppButton';
import { useUiStore } from '../../../stores/uiStore';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  children: React.ReactNode;
}

const AdminFormModal: React.FC<Props> = ({
  open, title, onClose, onSubmit, submitting = false, children,
}) => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
          <Pressable
            className={`rounded-t-3xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}
            style={{ maxHeight: '85%' }}
            onPress={() => {}}
          >
            {/* Handle */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-gray-300" />
            </View>

            {/* Header */}
            <View className={`flex-row items-center justify-between px-5 py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
              <Pressable
                className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}
                onPress={onClose}
              >
                <Text className={isDark ? 'text-gray-300' : 'text-gray-500'}>✕</Text>
              </Pressable>
            </View>

            {/* Body */}
            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {children}

              {/* Submit */}
              <AppButton
                variant="contained"
                color="primary"
                fullWidth
                loading={submitting}
                loadingText="Saving…"
                onPress={onSubmit}
                style={{ marginTop: 8 }}
              >
                Save
              </AppButton>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AdminFormModal;
