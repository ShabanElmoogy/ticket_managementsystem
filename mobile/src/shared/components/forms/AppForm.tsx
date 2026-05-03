/**
 * AppForm — React Hook Form wrapper with FormProvider + scroll-to-error.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 * - AdminFormPage (features/admin/shared/AdminFormPage.tsx)
 *   When a `form` prop is passed, renders AppForm instead of a plain ScrollView.
 *   Exposes `focusFirst` via `onFocusRef` so AdminFormPage can scroll-to-error
 *   on submit failure.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PROVIDES
 * ─────────────────────────────────────────────────────────────────────────────
 * - FormProvider (RHF context for useFormContext / Controller)
 * - FormFocusProvider (field registration + scroll-to-error)
 * - ScrollView with ref forwarding
 * - onFocusRef callback so parent can trigger focusFirst on submit error
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLE
 * ─────────────────────────────────────────────────────────────────────────────
 *   const focusFirstError = useRef<(names: string[]) => void>();
 *   <AppForm form={form} onFocusRef={(fn) => { focusFirstError.current = fn; }}>
 *     <AppFormField name="email" ... />
 *   </AppForm>
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — no theme/i18n hooks. useFormFocus is a context utility (useRef/useCallback only).
 */

import React, { useRef } from 'react';
import { ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { FormProvider, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { FormFocusProvider, useFormFocus } from './FormFocusContext';

export interface AppFormProps<T extends FieldValues> {
  form:                    UseFormReturn<T>;
  children?:               React.ReactNode;
  scrollRef?:              React.RefObject<InstanceType<typeof ScrollView>>;
  style?:                  ViewStyle;
  contentContainerStyle?:  ViewStyle;
  /** Called with focusFirst so parent can scroll-to-error on submit failure */
  onFocusRef?:             (fn: (names: string[]) => void) => void;
}

// ── Inner — has access to FormFocusContext ────────────────────────────────────

function AppFormInner({
  scrollRef, children, style, contentContainerStyle, onFocusRef,
}: {
  scrollRef:              React.RefObject<InstanceType<typeof ScrollView>>;
  children?:              React.ReactNode;
  style?:                 ViewStyle;
  contentContainerStyle?: ViewStyle;
  onFocusRef?:            (fn: (names: string[]) => void) => void;
}) {
  const { focusFirst } = useFormFocus();

  // Expose focusFirst to parent (AdminFormPage stores it in focusFirstError.current)
  React.useEffect(() => {
    onFocusRef?.((names: string[]) => focusFirst(names, scrollRef));
  }, [focusFirst, scrollRef, onFocusRef]);

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={style}
      contentContainerStyle={contentContainerStyle ?? styles.contentContainer}
    >
      {children}
    </ScrollView>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function AppForm<T extends FieldValues>({
  form, children, scrollRef: externalScrollRef, style, contentContainerStyle, onFocusRef,
}: AppFormProps<T>) {
  const internalScrollRef = useRef<InstanceType<typeof ScrollView>>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;

  return (
    <FormProvider {...form} children={undefined}>
      <FormFocusProvider>
        <AppFormInner
          scrollRef={scrollRef}
          style={style}
          contentContainerStyle={contentContainerStyle}
          onFocusRef={onFocusRef}
        >
          {children}
        </AppFormInner>
      </FormFocusProvider>
    </FormProvider>
  );
}

export default AppForm;

const styles = StyleSheet.create({
  contentContainer: {
    padding:        16,
    paddingBottom:  32,
  },
});
