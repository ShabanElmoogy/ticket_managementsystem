import React, { useRef, memo } from 'react';
import {
  View, Text, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, Modal,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../shared/components';
import { FormScrollProvider } from './FormScrollContext';
import { useUiStore } from '../../../stores/uiStore';

export interface AdminFormPageProps {
  title:           string;
  onBack:          () => void;
  onSubmit:        () => void;
  submitting?:     boolean;
  submitDisabled?: boolean;
  submitLabel?:    string;
  /** When false, button shows muted "fill required fields" hint */
  isDirty?:        boolean;
  children:        React.ReactNode;
}

/**
 * AdminFormPage — full-screen form page for admin CRUD.
 *
 * Why better than Modal for forms:
 * - OS handles keyboard avoidance natively (no KAV fighting)
 * - No animation lag — native screen transition
 * - Native back gesture / back button
 * - Full screen = more space for fields
 * - ScrollView + keyboard just works
 *
 * Usage: render inside an Expo Router screen, pass router.back() as onBack.
 */
const AdminFormPage: React.FC<AdminFormPageProps> = memo(({
  title,
  onBack,
  onSubmit,
  submitting     = false,
  submitDisabled = false,
  submitLabel,
  isDirty        = true,
  children,
}) => {
  const { t }       = useTranslation();
  const colorMode   = useUiStore((s) => s.colorMode);
  const direction   = useUiStore((s) => s.direction);
  const isDark      = colorMode === 'dark';
  const isRtl       = direction === 'rtl';
  const insets      = useSafeAreaInsets();
  const scrollRef   = useRef<ScrollView>(null);

  const resolvedLabel = submitLabel ?? t('common.save');
  const isDisabled    = submitDisabled || submitting;

  // Button label + color based on form state
  const btnLabel  = submitting ? t('common.saving') : !isDirty ? t('common.fillRequired') : resolvedLabel;
  const btnColor  = !isDirty && !submitting ? 'secondary' : 'primary';

  const bg         = isDark ? '#0f172a' : '#f8fafc';
  const headerBg   = isDark ? '#1e293b' : '#ffffff';
  const borderCol  = isDark ? '#334155' : '#e5e7eb';
  const titleColor = isDark ? '#f1f5f9' : '#111827';
  const backColor  = isDark ? '#94a3b8' : '#6b7280';
  const backBg     = isDark ? '#334155' : '#f3f4f6';

  return (
    <Modal
      visible
      transparent={false}
      animationType="slide"
      onRequestClose={onBack}
      statusBarTranslucent
    >
      <View style={[styles.root, { backgroundColor: bg, direction: isRtl ? 'rtl' : 'ltr' }]}>
        {/* Header — fixed at top, safe area aware */}
        <View
          style={[
            styles.header,
            {
              paddingTop:        insets.top + 8,
              backgroundColor:   headerBg,
              borderBottomColor: borderCol,
            },
          ]}
        >
          <Pressable
            onPress={onBack}
            style={[styles.backBtn, { backgroundColor: backBg }]}
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <Text style={{ color: backColor, fontSize: 18 }}>
              {isRtl ? '→' : '←'}
            </Text>
          </Pressable>

          <Text style={[styles.headerTitle, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>

          {/* Spacer to balance the back button */}
          <View style={styles.backBtn} />
        </View>

        {/* KeyboardAvoidingView on a full page — works perfectly */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 32 },
            ]}
          >
            <FormScrollProvider scrollRef={scrollRef} mode="page">
              {children}
            </FormScrollProvider>

            <AppButton
              variant="contained"
              color={btnColor}
              fullWidth
              loading={submitting}
              loadingText={t('common.saving')}
              onPress={onSubmit}
              disabled={isDisabled}
              style={styles.submitBtn}
            >
              {btnLabel}
            </AppButton>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

AdminFormPage.displayName = 'AdminFormPage';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  submitBtn: {
    marginTop: 24,
  },
});

export default AdminFormPage;
