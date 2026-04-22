import React, { useRef } from 'react';
import {
  View, Text, Pressable, Modal, ScrollView,
  KeyboardAvoidingView, Platform,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../shared/components';
import { FormScrollProvider } from './FormScrollContext';
import { useUiStore } from '../../../stores/uiStore';

export interface AdminFormModalProps {
  open:             boolean;
  title:            string;
  onClose:          () => void;
  onSubmit:         () => void;
  submitting?:      boolean;
  /** Disables the submit button — e.g. when form is not dirty */
  submitDisabled?:  boolean;
  /** Custom submit button label. Defaults to t('common.save') */
  submitLabel?:     string;
  children:         React.ReactNode;
}

/**
 * AdminFormModal — bottom-sheet modal for admin CRUD forms.
 *
 * - KeyboardAvoidingView lifts the sheet above the keyboard
 * - FormScrollProvider tracks field Y positions for auto-scroll on focus
 * - submitDisabled: disables submit (e.g. !isDirty || submitting)
 * - submitLabel: custom label (defaults to t('common.save'))
 */
const AdminFormModal: React.FC<AdminFormModalProps> = ({
  open,
  title,
  onClose,
  onSubmit,
  submitting     = false,
  submitDisabled = false,
  submitLabel,
  children,
}) => {
  const { t }                  = useTranslation();
  const { colorMode, direction } = useUiStore();
  const isDark   = colorMode === 'dark';
  const isRtl    = direction === 'rtl';
  const insets   = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const maxSheetHeight  = screenHeight * 0.85;
  const resolvedLabel   = submitLabel ?? t('common.save');
  const isDisabled      = submitDisabled || submitting;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* KAV lifts the sheet above the keyboard */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View
            style={[
              styles.sheet,
              {
                maxHeight:       maxSheetHeight,
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                direction:       isRtl ? 'rtl' : 'ltr',
              },
            ]}
          >
            {/* Drag handle */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {/* Header — fixed, never scrolls */}
            <View style={[styles.header, { borderBottomColor: isDark ? '#334155' : '#f1f5f9' }]}>
              <Text style={[styles.headerTitle, { color: isDark ? '#f1f5f9' : '#111827' }]}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: isDark ? '#334155' : '#f3f4f6' }]}
                accessibilityLabel={t('common.close')}
                accessibilityRole="button"
              >
                <Text style={{ color: isDark ? '#94a3b8' : '#6b7280', fontSize: 16 }}>✕</Text>
              </Pressable>
            </View>

            {/* Scrollable content — FormScrollProvider tracks field positions */}
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 32 },
              ]}
            >
              <FormScrollProvider scrollRef={scrollRef}>
                {children}
              </FormScrollProvider>

              <AppButton
                variant="contained"
                color="primary"
                fullWidth
                loading={submitting}
                loadingText={t('common.saving')}
                onPress={onSubmit}
                disabled={isDisabled}
                style={{ marginTop: 16 }}
              >
                {resolvedLabel}
              </AppButton>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
