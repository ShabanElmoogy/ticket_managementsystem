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

interface AppFormFieldProps<T extends FieldValues> {
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
  const { registerRef, registerY } = useFormFocus();

  // Register inputRef into FormFocusContext once on mount
  // (not during render — side effects belong in useEffect)
  const childInputRef = (children?.props as Record<string, unknown>)?.inputRef as React.RefObject<{ focus(): void }> | undefined;
  useEffect(() => {
    if (childInputRef) registerRef(String(name), childInputRef);
  }, [name, childInputRef, registerRef]);

  // Stable wrapped nextRef — validates current field before advancing
  // useRef so the object identity is stable across renders
  const originalNextRef = (children?.props as Record<string, unknown>)?.nextRef as React.RefObject<{ focus(): void }> | undefined;
  const wrappedNextRef  = useRef(
    originalNextRef
      ? {
          current: {
            focus: async () => {
              const valid = trigger ? await trigger(name) : true;
              if (valid) originalNextRef.current?.focus();
            },
          },
        }
      : undefined,
  );

  // Keep the wrapped ref's focus function up to date if originalNextRef changes
  useEffect(() => {
    if (!originalNextRef || !wrappedNextRef.current) return;
    wrappedNextRef.current.current.focus = async () => {
      const valid = trigger ? await trigger(name) : true;
      if (valid) originalNextRef.current?.focus();
    };
  }, [name, trigger, originalNextRef]);

  return (
    <View
      onLayout={(e: { nativeEvent: { layout: { y: number } } }) => registerY(String(name), e.nativeEvent.layout.y)}
      style={[style, disabled ? { opacity: 0.45 } : undefined]}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) =>
          React.cloneElement(children as React.ReactElement<Record<string, unknown>> & { key: string | null }, {
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
