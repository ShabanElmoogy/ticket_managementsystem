import React, { useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, Modal, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';
import { FormScrollProvider } from '@/src/features/admin/shared/FormScrollContext';
import DialogButton from '@/src/shared/components/actions/DialogButton';
import { AlertDialog } from '@/src/shared/components/dialogs';

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
  const { t }       = useTranslation();
  const c           = useThemeColors();
  const isRtl       = useUiStore((s) => s.direction) === 'rtl';
  const insets      = useSafeAreaInsets();
  const scrollRef   = useRef<InstanceType<typeof ScrollView>>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  const resolvedLabel = submitLabel ?? t('common.save');
  const isDisabled    = submitDisabled || submitting;

  const handleBack = () => {
    if (isDirty) {
      setShowDiscard(true);
    } else {
      onBack();
    }
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

          {/* Spacer — keeps title centered */}
          <View style={styles.backBtn} />
        </View>

        {/* Scrollable fields */}
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
            <FormScrollProvider scrollRef={scrollRef} mode="page" children={children} />
          </ScrollView>

          {/* Sticky footer */}
          <View style={[styles.footer, {
            paddingBottom:   insets.bottom - 20,
            backgroundColor: c.surface.primary,
            borderTopColor:  c.border.primary,
          }]}>
            {!isDirty && !submitting && (
              <View style={[styles.hintRow, {
                backgroundColor: c.intent.warningSurface,
                borderColor:     c.intent.warning + '55',
              }]}>
                <View style={[styles.hintIconWrap, { backgroundColor: c.intent.warning + '22' }]}>
                  <Text style={styles.hintIcon}>⚠️</Text>
                </View>
                <Text style={[styles.hintText, { color: c.intent.warning }]}>
                  {t('common.fillRequired')}
                </Text>
              </View>
            )}

            <DialogButton
              label={submitting ? t('common.saving') : resolvedLabel}
              icon={submitting ? 'hourglass-empty' : 'save'}
              onPress={onSubmit}
              disabled={isDisabled}
              style={{
                backgroundColor: isDisabled ? c.interactive.disabled : c.buttons.primary.bg,
                shadowColor:     c.buttons.primary.bg,
                shadowOffset:    { width: 0, height: 4 },
                shadowOpacity:   isDisabled ? 0 : 0.35,
                shadowRadius:    10,
                elevation:       isDisabled ? 0 : 6,
              }}
              labelStyle={{ color: c.buttons.primary.text }}
              iconColor={c.buttons.primary.text}
            />
          </View>
        </KeyboardAvoidingView>
      </View>

      </Modal>

      {/* Discard changes confirmation — rendered outside Modal to avoid nested native view tree issues */}
      <AlertDialog
        visible={showDiscard}
        onClose={() => setShowDiscard(false)}
        title={t('common.discardChanges')}
        message={t('common.discardChangesMessage')}
        icon="⚠️"
        accentColor={c.intent.warning}
        actions={[
          {
            label:   t('common.discard'),
            onPress: () => { setShowDiscard(false); onBack(); },
            variant: 'primary',
          },
          {
            label:   t('common.keepEditing'),
            onPress: () => setShowDiscard(false),
            variant: 'cancel',
          },
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
    gap:               10,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: -2 },
    shadowOpacity:     0.06,
    shadowRadius:      6,
    elevation:         8,
  },
  hintRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderRadius:      Radius.lg,
    borderWidth:       1,
  },
  hintIconWrap: {
    width:          28,
    height:         28,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  hintIcon: { fontSize: 14 },
  hintText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    flex:       1,
  },
});

export default AdminFormPage;
