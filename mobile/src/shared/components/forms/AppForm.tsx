import React, { useRef } from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { FormProvider, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { FormFocusProvider, useFormFocus } from './FormFocusContext';

export interface AppFormProps<T extends FieldValues> {
  form:                    UseFormReturn<T>;
  children?:               React.ReactNode;
  scrollRef?:              React.RefObject<any>;
  style?:                  ScrollViewProps['style'];
  contentContainerStyle?:  ScrollViewProps['contentContainerStyle'];
  /** Called with the focusFirstError function so parent can trigger scroll-to-error */
  onFocusRef?:             (fn: (names: string[]) => void) => void;
}

// Inner — has access to FormFocusContext
function AppFormInner({
  scrollRef, children, style, contentContainerStyle, onFocusRef,
}: {
  scrollRef:              React.RefObject<any>;
  children?:              React.ReactNode;
  style?:                 ScrollViewProps['style'];
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  onFocusRef?:            (fn: (names: string[]) => void) => void;
}) {
  const { focusFirst } = useFormFocus();

  // Expose focusFirstError to parent via callback
  React.useEffect(() => {
    onFocusRef?.((names: string[]) => focusFirst(names, scrollRef));
  }, [focusFirst, scrollRef, onFocusRef]);

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={style}
      contentContainerStyle={contentContainerStyle ?? { padding: 16, paddingBottom: 32 }}
    >
      {children}
    </ScrollView>
  );
}

function AppForm<T extends FieldValues>({
  form, children, scrollRef: externalScrollRef, style, contentContainerStyle, onFocusRef,
}: AppFormProps<T>) {
  const internalScrollRef = useRef<any>(null);
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
