import React, { useRef } from 'react';
import { View } from 'react-native';
import { useFormScroll } from './FormScrollContext';

let fieldCounter = 0;

interface FormFieldProps {
  children:  React.ReactNode;
  fieldId?:  string;
}

const FormField = React.memo(({ children, fieldId }: FormFieldProps) => {
  const id = useRef(fieldId ?? `field_${++fieldCounter}`).current;
  const { mode, registerField, registerFieldY, registerFieldRef, scrollToField, canFocusField } = useFormScroll();

  return (
    <View
      onLayout={(e: any) => registerFieldY(id, e.nativeEvent.layout.y)}
    >
      {React.Children.map(children, (child: any) => {
        if (!React.isValidElement(child)) return child;

        const props = child.props as Record<string, unknown>;

        // Register inputRef
        const inputRef = props.inputRef as React.RefObject<any> | undefined;
        if (inputRef) registerFieldRef(id, inputRef);

        // Register required + getValue + label so canFocusField can check them
        const isRequired = !!(props.required);
        const label      = String(props.label ?? '').replace(' *', '').trim();
        const value      = props.value;
        registerField(id, {
          required: isRequired,
          label,
          getValue: () => String(value ?? '').trim(),
        });

        const originalOnFocus = props.onFocus as ((...args: unknown[]) => void) | undefined;

        return React.cloneElement(child as any, {
          onFocus: (...args: unknown[]) => {
            // Block focus if a required field above this one is empty
            if (!canFocusField(id)) return;
            scrollToField(id);
            originalOnFocus?.(...args);
          },
        });
      })}
    </View>
  );
});

FormField.displayName = 'FormField';

export default FormField;
