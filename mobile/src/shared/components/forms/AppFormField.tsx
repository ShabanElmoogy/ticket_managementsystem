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
 *   CustomerForm — all text input fields (name, email, phone, company, address)
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
 * No hooks called internally — Modal-safe.
 * Uses FormFocusContext (from FormFocusProvider) and RHF context (from FormProvider).
 * Both must be present in the tree above this component.
 */

import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
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
}

function AppFormField<T extends FieldValues>({
  name, control, children, transform,
}: AppFormFieldProps<T>) {
  const formContext = useFormContext<T>();
  const trigger     = formContext?.trigger;
  const { registerRef, registerY } = useFormFocus();

  // Register inputRef into FormFocusContext once on mount
  // (not during render — side effects belong in useEffect)
  const childInputRef = (children?.props as any)?.inputRef as React.RefObject<any> | undefined;
  useEffect(() => {
    if (childInputRef) registerRef(String(name), childInputRef);
  }, [name, childInputRef, registerRef]);

  // Stable wrapped nextRef — validates current field before advancing
  // useRef so the object identity is stable across renders
  const originalNextRef = (children?.props as any)?.nextRef as React.RefObject<any> | undefined;
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
    <View onLayout={(e: any) => registerY(String(name), e.nativeEvent.layout.y)}>
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
