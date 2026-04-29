/**
 * AppForm — React Hook Form wrapper with scroll-to-error support.
 *
 * ⚠️ STATUS: INCOMPLETE / NOT USED
 *
 * This component was started but never finished. It depends on `FormFocusContext`
 * which doesn't exist. The project uses a different pattern instead:
 *
 *   AdminFormPage + FormScrollContext + FormField
 *
 * If you need RHF integration, complete this component by:
 * 1. Creating `FormFocusContext.tsx` with field registration + scroll-to-error
 * 2. Creating `AppFormField.tsx` that wraps RHF Controller + registers with context
 * 3. Updating `AdminFormPage` to optionally accept a `form` prop and use this component
 *
 * OR delete this file and continue using the existing FormScrollContext pattern.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INTENDED USAGE (if completed)
 * ─────────────────────────────────────────────────────────────────────────────
 *   const form = useForm<FormValues>({ resolver: zodResolver(schema) });
 *
 *   <AppForm form={form}>
 *     <AppFormField name="email" label="Email" component={AppTextInput} />
 *     <AppFormField name="phone" label="Phone" component={AppTextInput} />
 *   </AppForm>
 */

import React, { useRef } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { FormProvider, type UseFormReturn, type FieldValues } from 'react-hook-form';

export interface AppFormProps<T extends FieldValues> {
  form:                    UseFormReturn<T>;
  children?:               React.ReactNode;
  scrollRef?:              React.RefObject<InstanceType<typeof ScrollView>>;
  style?:                  ScrollViewProps['style'];
  contentContainerStyle?:  ScrollViewProps['contentContainerStyle'];
  /** Called with the focusFirstError function so parent can trigger scroll-to-error */
  onFocusRef?:             (fn: (names: string[]) => void) => void;
}

function AppForm<T extends FieldValues>({
  form, children, scrollRef: externalScrollRef, style, contentContainerStyle, onFocusRef,
}: AppFormProps<T>) {
  const internalScrollRef = useRef<InstanceType<typeof ScrollView>>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;

  // TODO: Implement FormFocusProvider + field registration + scroll-to-error
  // For now this is a basic wrapper around FormProvider + ScrollView

  return (
    <FormProvider {...form} children={children}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={style}
        contentContainerStyle={contentContainerStyle ?? { padding: 16, paddingBottom: 32 }}
      >
        {children}
      </ScrollView>
    </FormProvider>
  );
}

export default AppForm;
