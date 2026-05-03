import React, { useRef } from 'react';
import { View } from 'react-native';
import { useFormScroll } from './FormScrollContext';

let fieldCounter = 0;

interface FormFieldProps {
  children?:  React.ReactNode;
  fieldId?:  string;
}

const FormField = React.memo(({ children, fieldId }: FormFieldProps) => {
  const id = useRef(fieldId ?? `field_${++fieldCounter}`).current;
  const {
    registerField, registerFieldY, registerFieldRef,
    scrollToField, canFocusField, markFieldError, validateField,
    errorFieldId, clearError,
  } = useFormScroll();

  const hasError = errorFieldId === id;

  return (
    <View onLayout={(e: any) => registerFieldY(id, e.nativeEvent.layout.y)}>
      {React.Children.map(children, (child: any) => {
        if (!React.isValidElement(child)) return child;

        const props = child.props as Record<string, unknown>;

        // Register inputRef
        const inputRef = props.inputRef as React.RefObject<any> | undefined;
        if (inputRef) registerFieldRef(id, inputRef);

        // Register required + getValue + label
        const isRequired = !!(props.required);
        const label      = String(props.label ?? '').replace(' *', '').trim();
        const value      = props.value;
        registerField(id, {
          required: isRequired,
          label,
          getValue: () => String(value ?? '').trim(),
        });

        const originalOnFocus  = props.onFocus      as ((...args: unknown[]) => void) | undefined;
        const originalOnChange = props.onChangeText  as ((...args: unknown[]) => void) | undefined;
        const nextRef          = props.nextRef       as React.RefObject<any> | undefined;

        // Wrap nextRef so pressing keyboard "Next" validates first
        const wrappedNextRef = nextRef
          ? {
              current: {
                focus: () => {
                  // Read live value from registered getValue — not stale closure
                  if (!validateField(id)) return; // marks error + blocks
                  nextRef.current?.focus();
                },
              },
            }
          : undefined;

        return React.cloneElement(child as any, {
          // Inline error when this field is blocked
          error: hasError
            ? `${label || 'This field'} is required`
            : (props.error as string | undefined),

          // Replace nextRef with wrapped version
          ...(nextRef ? { nextRef: wrappedNextRef } : {}),

          onFocus: (...args: unknown[]) => {
            if (!canFocusField(id)) return;
            scrollToField(id);
            originalOnFocus?.(...args);
          },

          // Clear error as soon as user starts typing
          onChangeText: (...args: unknown[]) => {
            if (hasError) clearError();
            originalOnChange?.(...args);
          },
        });
      })}
    </View>
  );
});

FormField.displayName = 'FormField';

export default FormField;
