import React from 'react';
import {
  View, Text, Pressable, Platform,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../../../shared/components';
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
  const { colorMode, direction } = useUiStore();
  const isDark = colorMode === 'dark';
  const isRtl  = direction === 'rtl';
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const maxSheetHeight = screenHeight * 0.85;

  if (!open) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={onClose}
      />

      {/* Sheet anchored to bottom */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: maxSheetHeight,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 16,
          direction: isRtl ? 'rtl' : 'ltr',
        }}
      >
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
        </View>

        {/* Header — fixed */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#334155' : '#f1f5f9',
        }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827', flex: 1 }}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: isDark ? '#334155' : '#f3f4f6',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ color: isDark ? '#94a3b8' : '#6b7280', fontSize: 16 }}>✕</Text>
          </Pressable>
        </View>

        {/* KeyboardAwareScrollView — auto-scrolls focused field into view */}
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={false}
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={16}
          extraHeight={16}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 32,
          }}
        >
          {children}

          <AppButton
            variant="contained"
            color="primary"
            fullWidth
            loading={submitting}
            loadingText="Saving…"
            onPress={onSubmit}
            style={{ marginTop: 16 }}
          >
            Save
          </AppButton>
        </KeyboardAwareScrollView>
      </View>
    </View>
  );
};

export default AdminFormModal;
