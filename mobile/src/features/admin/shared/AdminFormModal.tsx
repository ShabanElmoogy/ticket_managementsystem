import React, { useRef } from 'react';
import { View, Text, Pressable, Modal, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';
import DialogButton from '@/src/shared/components/actions/DialogButton';
import { FormScrollProvider } from '@/src/features/admin/shared/FormScrollContext';

export interface AdminFormModalProps {
  open:             boolean;
  title:            string;
  onClose:          () => void;
  onSubmit:         () => void;
  submitting?:      boolean;
  submitDisabled?:  boolean;
  submitLabel?:     string;
  children?: React.ReactNode;
}

const AdminFormModal: React.FC<AdminFormModalProps> = ({
  open, title, onClose, onSubmit,
  submitting = false, submitDisabled = false, submitLabel, children,
}) => {
  const { t }       = useTranslation();
  const c           = useThemeColors();
  const direction   = useUiStore((s) => s.direction);
  const isRtl       = direction === 'rtl';
  const insets      = useSafeAreaInsets();
  const { height }  = useWindowDimensions();
  const scrollRef   = useRef<any>(null);

  const maxSheetHeight = height * 0.85;
  const resolvedLabel  = submitLabel ?? t('common.save');
  const isDisabled     = submitDisabled || submitting;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <View style={[
            styles.sheet,
            {
              maxHeight:       maxSheetHeight,
              backgroundColor: c.surface.primary,
              direction:       isRtl ? 'rtl' : 'ltr',
              shadowColor:     c.shadow,
            },
          ]}>
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: c.border.secondary }]} />
            </View>

            <View style={[styles.header, { borderBottomColor: c.border.primary }]}>
              <Text style={[styles.headerTitle, { color: c.text.primary }]}>{title}</Text>
              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: c.surface.tertiary }]} accessibilityLabel={t('common.close')} accessibilityRole="button">
                <Text style={{ color: c.text.secondary, fontSize: FontSize.xl }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: 8 }]}
            >
              <FormScrollProvider scrollRef={scrollRef} mode="modal" children={children} />
            </ScrollView>

            {/* ── Sticky footer ── */}
            <View style={[
              styles.footer,
              { paddingBottom: insets.bottom || 10, backgroundColor: c.surface.primary, borderTopColor: c.border.primary },
            ]}>
              <DialogButton
                label={submitting ? t('common.saving') : resolvedLabel}
                onPress={onSubmit}
                disabled={isDisabled}
                style={{ backgroundColor: c.buttons.primary.bg }}
                labelStyle={{ color: c.buttons.primary.text }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, justifyContent: 'flex-end' },
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:       { borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 16 },
  handleRow:   { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle:      { width: 40, height: 4, borderRadius: 2 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, flex: 1 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
  saveBtn: {
    minHeight: 54,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
  saveIcon: {
    fontSize: 18,
    color: '#fff',
    marginTop: -1,
  },
});

export default AdminFormModal;

