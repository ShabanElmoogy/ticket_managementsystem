import React, { useRef, memo } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../../../shared/components';
import { FormScrollProvider } from './FormScrollContext';
import { useThemeColors, Palette, FontSize, FontWeight, Radius } from '../../../constants/theme';
import { useUiStore } from '../../../stores/uiStore';

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
}) => {
  const { t }     = useTranslation();
  const c         = useThemeColors();
  const direction = useUiStore((s) => s.direction);
  const isRtl     = direction === 'rtl';
  const insets    = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const resolvedLabel = submitLabel ?? t('common.save');
  const isDisabled    = submitDisabled || submitting;
  const btnLabel      = submitting ? t('common.saving') : !isDirty ? t('common.fillRequired') : resolvedLabel;
  const btnColor      = !isDirty && !submitting ? 'secondary' : 'primary';

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onBack} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: c.surface.secondary, direction: isRtl ? 'rtl' : 'ltr' }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface.primary, borderBottomColor: c.border.primary }]}>
          <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: c.surface.tertiary }]} accessibilityLabel={t('common.back')} accessibilityRole="button">
            <Text style={{ color: c.text.secondary, fontSize: FontSize['2xl'] }}>{isRtl ? '→' : '←'}</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text.primary }]} numberOfLines={1}>{title}</Text>
          <View style={styles.backBtn} />
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}>
            <FormScrollProvider scrollRef={scrollRef} mode="page">
              {children}
            </FormScrollProvider>
            <AppButton variant="contained" color={btnColor} fullWidth loading={submitting} loadingText={t('common.saving')} onPress={onSubmit} disabled={isDisabled} style={styles.submitBtn}>
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
  root:        { flex: 1 },
  flex:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  headerTitle: { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'center' },
  backBtn:     { width: 36, height: 36, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20 },
  submitBtn:   { marginTop: 24 },
});

export default AdminFormPage;
