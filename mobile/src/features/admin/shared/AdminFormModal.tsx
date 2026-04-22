import React from 'react';
import {
  View, Text, Pressable, Modal,
  KeyboardAvoidingView, Platform,
  StyleSheet, useWindowDimensions, ScrollView,
} from 'react-native';
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

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Full-screen backdrop — tap outside to close */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      />

      {/* KeyboardAvoidingView lifts the sheet above the keyboard */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Sheet */}
        <View
          style={[
            styles.sheet,
            {
              maxHeight: maxSheetHeight,
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              direction: isRtl ? 'rtl' : 'ltr',
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={[
            styles.header,
            { borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
          ]}>
            <Text style={[styles.headerTitle, { color: isDark ? '#f1f5f9' : '#111827' }]}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#334155' : '#f3f4f6' }]}
            >
              <Text style={{ color: isDark ? '#94a3b8' : '#6b7280', fontSize: 16 }}>✕</Text>
            </Pressable>
          </View>

          {/* Scrollable content — does NOT scroll the sheet off-screen */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 32 },
            ]}
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  // Sits at the bottom of the screen; KAV pushes it up when keyboard opens
  kavContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
  },
});

export default AdminFormModal;
