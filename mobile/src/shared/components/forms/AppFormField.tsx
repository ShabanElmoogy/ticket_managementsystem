/**
 * AppFormField — React Hook Form Controller wrapper for AppTextInput.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IT DOES
 * ─────────────────────────────────────────────────────────────────────────────
 *   - Connects a form field to RHF via Controller
 *   - Injects value, onChangeText, onBlur, error into the child input
 *   - Registers the field's Y position + inputRef into FormFocusContext
 *     so scrollToFirstError can scroll + focus the first invalid field
 *   - Wraps nextRef to validate the current field before advancing
 *   - Wires onClear to RHF onChange so clearing updates form state
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   CustomerForm (features/admin/customers/components/CustomerForm.tsx)
 *   — all text input fields (name, email, phone, company, address)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   const { control } = useForm<FormValues>();
 *
 *   <AppFormField name="email" control={control}>
 *     <AppTextInput
 *       label="Email *"
 *       inputRef={emailRef}
 *       nextRef={phoneRef}
 *       fieldType="email"
 *       required
 *     />
 *   </AppFormField>
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * No theme/i18n hooks (useThemeColors, useTranslation, etc.).
 * Uses useFormContext (RHF) and useFormFocus (ref/callback context only) —
 * neither reads from Zustand or React context that breaks inside a Modal.
 * Both FormProvider and FormFocusProvider must be present above this component.
 */

import React, { useEffect, useRef } from 'react';
import { View, type ViewStyle } from 'react-native';
import {
  Controller,
  useFormContext,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { useFormFocus } from './FormFocusContext';

type FocusableRef = React.RefObject<{ focus(): void } | null>;

export interface AppFormFieldProps<T extends FieldValues> {
  /** RHF field name — must match a key in the form schema */
  name:       Path<T>;
  /** RHF control object from useForm() */
  control:    Control<T>;
  /** The input component to render — must accept value, onChangeText, error props */
  children?:  React.ReactElement<any>;
  /** Optional value transformer applied before calling RHF onChange */
  transform?: (v: string) => string;
  /** Container style override — use for margin adjustments between fields */
  style?:     ViewStyle;
  /** Dims the field wrapper and blocks interaction */
  disabled?:  boolean;
}

function AppFormField<T extends FieldValues>({
  name, control, children, transform, style, disabled = false,
}: AppFormFieldProps<T>) {
  const formContext = useFormContext<T>();
  const trigger     = formContext?.trigger;
  const { registerRef, registerY, unregisterField } = useFormFocus();

  // Register inputRef into FormFocusContext once on mount.
  // Unregister on unmount to clean up conditional fields.
  // Read from children.props inside the effect — avoids re-running when
  // children identity changes due to inline JSX re-creation.
  useEffect(() => {
    const childInputRef = (children?.props as Record<string, unknown>)?.inputRef as React.RefObject<any> | undefined;
    if (childInputRef) registerRef(String(name), childInputRef);
    return () => unregisterField(String(name));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, registerRef, unregisterField]);

  // Stable wrapped nextRef — validates current field before advancing.
  // Stored in a ref so its identity is stable across renders.
  // The inner focus function is updated via useEffect when dependencies change.
  const wrappedNextRef = useRef<{ current: { focus(): void } } | undefined>(undefined);

  useEffect(() => {
    const originalNextRef = (children?.props as Record<string, unknown>)?.nextRef as FocusableRef | undefined;
    if (!originalNextRef) {
      wrappedNextRef.current = undefined;
      return;
    }
    // Create or update the wrapped ref with the latest trigger + originalNextRef
    const focusFn = async () => {
      const valid = trigger ? await trigger(name) : true;
      if (valid) originalNextRef.current?.focus();
    };
    if (!wrappedNextRef.current) {
      wrappedNextRef.current = { current: { focus: focusFn } };
    } else {
      wrappedNextRef.current.current.focus = focusFn;
    }
  }, [name, trigger, children?.props]);

  return (
    <View
      onLayout={(e: { nativeEvent: { layout: { y: number } } }) =>
        registerY(String(name), e.nativeEvent.layout.y)
      }
      style={[
        style,
        disabled ? { opacity: 0.45, pointerEvents: 'none' } : undefined,
      ]}
    >
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          React.cloneElement(children as any, {
            value:        value ?? '',
            onChangeText: (v: string) => onChange(transform ? transform(v) : v),
            onBlur,
            error:        error?.message,
            onClear:      () => onChange(''),
            ...(wrappedNextRef.current ? { nextRef: wrappedNextRef.current } : {}),
          })
        }
      />
    </View>
  );
}

export default AppFormField;
