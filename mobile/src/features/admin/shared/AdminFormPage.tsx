import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, Modal, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';
import { type UseFormReturn, type FieldValues } from 'react-hook-form';
import AppForm from '@/src/shared/components/forms/AppForm';
import DialogButton from '@/src/shared/components/actions/DialogButton';
import { AlertDialog } from '@/src/shared/components/dialogs';

export interface AdminFormPageProps<T extends FieldValues = any> {
  title:           string;
  onBack:          () => void;
  onSubmit:        (() => void) | ((data: any) => Promise<void>);
  submitting?:     boolean;
  submitDisabled?: boolean;
  submitLabel?:    string;
  /** Pass UseFormReturn to enable RHF dirty tracking */
  form?:           UseFormReturn<T>;
  /** Called when RHF validation fails — use to scroll to first error */
  onInvalid?:      (errors: Record<string, any>) => void;
  /** Legacy: manual dirty flag (used when form is not provided) */
  isDirty?:        boolean;
  children?: React.ReactNode;
}

function AdminFormPage<T extends FieldValues = any>({
  title, onBack, onSubmit,
  submitting = false, submitDisabled = false, submitLabel,
  form, isDirty, onInvalid,
  children,
}: AdminFormPageProps<T>) {
  const { t }     = useTranslation();
  const c         = useThemeColors();
  const isRtl     = useUiStore((s) => s.direction) === 'rtl';
  const insets    = useSafeAreaInsets();
  const scrollRef      = useRef<any>(null);
  const focusFirstError = useRef<((names: string[]) => void) | null>(null);

  const [showDiscard, setShowDiscard] = useState(false);

  // RHF isDirty takes priority over manual prop
  const formIsDirty = form ? form.formState.isDirty : (isDirty !== false);

  const handleBack = useCallback(() => {
    if (formIsDirty) { setShowDiscard(true); return; }
    onBack();
  }, [formIsDirty, onBack]);

  const handleSubmit = () => {
    if (submitting || submitDisabled) return;
    // When form is provided, run RHF validation first, scroll to first error on invalid
    if (form) {
      form.handleSubmit(
        (data) => (onSubmit as (data: any) => any)(data),
        (errors) => {
          focusFirstError.current?.(Object.keys(errors));
        }
      )();
      return;
    }
    (onSubmit as () => void)();
  };

  return (
    <>
      <Modal visible transparent={false} animationType="slide" onRequestClose={handleBack} statusBarTranslucent>
        <View style={[styles.root, { backgroundColor: c.surface.secondary }]}>

          {/* Header */}
          <View style={[styles.header, {
            paddingTop:        insets.top + 8,
            backgroundColor:   c.surface.primary,
            borderBottomColor: c.border.primary,
          }]}>
            <Pressable
              onPress={handleBack}
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
            <View style={styles.backBtn} />
          </View>

          {/* Scrollable fields — AppForm handles FormProvider + ScrollView */}
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            {form ? (
              <AppForm
                form={form}
                scrollRef={scrollRef}
                contentContainerStyle={styles.scrollContent}
                onFocusRef={(fn) => { focusFirstError.current = fn; }}
              >
                {children}
              </AppForm>
            ) : (
              <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {children}
              </ScrollView>
            )}

            {/* Footer */}
            <View style={[styles.footer, {
              paddingBottom:   insets.bottom - 20,
              backgroundColor: c.surface.primary,
              borderTopColor:  c.border.primary,
            }]}>
              <DialogButton
                label={submitting ? t('common.saving') : (submitLabel ?? t('common.save'))}
                icon={submitting ? 'hourglass-empty' : 'save'}
                onPress={handleSubmit}
                disabled={submitting || submitDisabled}
                style={{
                  backgroundColor: (submitDisabled || submitting) ? c.interactive.disabled : c.buttons.primary.bg,
                  shadowColor:     c.buttons.primary.bg,
                  shadowOffset:    { width: 0, height: 4 },
                  shadowOpacity:   (submitDisabled || submitting) ? 0 : 0.35,
                  shadowRadius:    10,
                  elevation:       (submitDisabled || submitting) ? 0 : 6,
                }}
                labelStyle={{ color: c.buttons.primary.text }}
                iconColor={c.buttons.primary.text}
              />
            </View>
          </KeyboardAvoidingView>

        </View>
      </Modal>

      {/* Discard confirmation — outside Modal so hooks work */}
      <AlertDialog
        visible={showDiscard}
        onClose={() => setShowDiscard(false)}
        title={t('common.discardChanges')}
        message={t('common.discardChangesMessage')}
        icon="⚠️"
        accentColor={c.intent.warning}
        actions={[
          { label: t('common.discard'),     onPress: () => { setShowDiscard(false); onBack(); }, variant: 'primary' },
          { label: t('common.keepEditing'), onPress: () => setShowDiscard(false), variant: 'cancel' },
        ]}
      />
    </>
  );
}

AdminFormPage.displayName = 'AdminFormPage';

const styles = StyleSheet.create({
  root:  { flex: 1 },
  flex:  { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, gap: 12,
  },
  headerTitle: {
    flex: 1, fontSize: FontSize.xl,
    fontWeight: FontWeight.bold, textAlign: 'center',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 24 },
  footer: {
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 8,
  },
});

export default AdminFormPage;

