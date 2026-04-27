import React, { useRef, memo } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';
import { FormScrollProvider } from '@/src/features/admin/shared/FormScrollContext';
import AppButton from '@/src/shared/components/forms/AppButton';

export interface AdminFormPageProps {
  title:           string;
  onBack:          () => void;
  onSubmit:        () => void;
  submitting?:     boolean;
  submitDisabled?: boolean;
  submitLabel?:    string;
  isDirty?:        boolean;
  children:        React.ReactNode;
}

const AdminFormPage: React.FC<AdminFormPageProps> = memo(({
  title, onBack, onSubmit,
  submitting = false, submitDisabled = false, submitLabel,
  isDirty = true, children,
}: AdminFormPageProps) => {
  const { t }     = useTranslation();
  const c         = useThemeColors();
  const direction = useUiStore((s) => s.direction);
  const isRtl     = direction === 'rtl';
  const insets    = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);

  const resolvedLabel = submitLabel ?? t('common.save');
  const isDisabled    = submitDisabled || submitting || !isDirty;
  const btnLabel      = !isDirty ? t('common.fillRequired') : resolvedLabel;

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onBack} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: c.surface.secondary, direction: isRtl ? 'rtl' : 'ltr' }]}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface.primary, borderBottomColor: c.border.primary }]}>
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: c.surface.tertiary }]} accessibilityLabel={t('common.back')} accessibilityRole="button">
            <Text style={{ color: c.text.secondary, fontSize: FontSize['2xl'] }}>{isRtl ? '→' : '←'}</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text.primary }]} numberOfLines={1}>{title}</Text>
          <View style={styles.backBtn} />
        </View>

        {/* ── Scrollable form fields ── */}
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 }]}
          >
            <FormScrollProvider scrollRef={scrollRef} mode="page" children={children} />
          </ScrollView>

        {/* ── Sticky footer ── */}
          <View style={[
            styles.footer,
            { paddingBottom: insets.bottom || 10, backgroundColor: c.surface.primary, borderTopColor: c.border.primary },
          ]}>
            <AppButton
              variant="primary"
              size="large"
              fullWidth
              loading={submitting}
              loadingText={t('common.saving')}
              onPress={onSubmit}
              disabled={isDisabled}
              leftIcon={<Text style={{ fontSize: 17 }}>💾</Text>}
            >
              {resolvedLabel}
            </AppButton>
            {!isDirty && !submitting && (
              <Text style={{ fontSize: 11, color: c.text.muted, textAlign: 'center', marginTop: 6 }}>
                {t('common.fillRequired')}
              </Text>
            )}
          </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

AdminFormPage.displayName = 'AdminFormPage';

const styles = StyleSheet.create({
  root:          { flex: 1 },
  flex:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, gap: 12 },
  headerTitle:   { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  backBtn:       { width: 36, height: 36, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default AdminFormPage;
