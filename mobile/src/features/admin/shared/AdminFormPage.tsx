import React, { useRef } from 'react';
import {
  View, Text, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, Modal, StyleSheet,
} from 'react-native';
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

function AdminFormPage({
  title, onBack, onSubmit,
  submitting = false, submitDisabled = false, submitLabel,
  isDirty = true, children,
}: AdminFormPageProps) {
  const { t }     = useTranslation();
  const c         = useThemeColors();
  const isRtl     = useUiStore((s) => s.direction) === 'rtl';
  const insets    = useSafeAreaInsets();
  const scrollRef = useRef<InstanceType<typeof ScrollView>>(null);

  const resolvedLabel = submitLabel ?? t('common.save');
  const isDisabled    = submitDisabled || submitting;

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onBack} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: c.surface.secondary }]}>

        {/* ── Header ── */}
        <View style={[styles.header, {
          paddingTop:        insets.top + 8,
          backgroundColor:   c.surface.primary,
          borderBottomColor: c.border.primary,
        }]}>
          <Pressable
            onPress={onBack}
            style={[styles.backBtn, { backgroundColor: c.surface.tertiary }]}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Text style={{ color: c.text.secondary, fontSize: FontSize['2xl'] }}>
              {isRtl ? '→' : '←'}
            </Text>
          </Pressable>

          <Text style={[styles.headerTitle, { color: c.text.primary }]} numberOfLines={1}>
            {title}
          </Text>

          {/* Spacer — keeps title centered */}
          <View style={styles.backBtn} />
        </View>

        {/* ── Scrollable fields ── */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <FormScrollProvider scrollRef={scrollRef} mode="page">
              {children}
            </FormScrollProvider>
          </ScrollView>

          {/* ── Sticky footer ── */}
          <View style={[styles.footer, {
            paddingBottom:   insets.bottom + 8,
            backgroundColor: c.surface.primary,
            borderTopColor:  c.border.primary,
          }]}>
            {!isDirty && !submitting && (
              <Text style={[styles.hint, { color: c.text.muted }]}>
                ⚠️  {t('common.fillRequired')}
              </Text>
            )}
            <AppButton
              variant="primary"
              size="large"
              fullWidth
              loading={submitting}
              loadingText={t('common.saving')}
              onPress={onSubmit}
              disabled={isDisabled}
              leftIcon={<Text style={styles.btnIcon}>💾</Text>}
            >
              {resolvedLabel}
            </AppButton>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

AdminFormPage.displayName = 'AdminFormPage';

const styles = StyleSheet.create({
  root:  { flex: 1 },
  flex:  { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingBottom:     12,
    borderBottomWidth: 1,
    gap:               12,
  },
  headerTitle: {
    flex:       1,
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign:  'center',
  },
  backBtn: {
    width:          36,
    height:         36,
    borderRadius:   Radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding:       16,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop:        12,
    borderTopWidth:    1,
    gap:               8,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: -2 },
    shadowOpacity:     0.07,
    shadowRadius:      6,
    elevation:         8,
  },
  hint: {
    fontSize:  12,
    textAlign: 'center',
  },
  btnIcon: {
    fontSize: 16,
    color:    '#fff',
  },
});

export default AdminFormPage;
