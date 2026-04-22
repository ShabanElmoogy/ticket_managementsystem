import React, { useRef } from 'react';
import { View } from 'react-native';
import { useFormScroll } from './FormScrollContext';

let fieldCounter = 0;

interface FormFieldProps {
  children: React.ReactNode;
  fieldId?: string;
}

/**
 * FormField — wraps a single form input.
 *
 * In 'modal' mode: registers Y position + injects onFocus scroll handler.
 * In 'page'  mode: renders children as-is — OS handles keyboard avoidance,
 *                  no scroll injection needed.
 */
const FormField: React.FC<FormFieldProps> = React.memo(({ children, fieldId }) => {
  const id = useRef(fieldId ?? `field_${++fieldCounter}`).current;
  const { mode, registerFieldY, scrollToField } = useFormScroll();

  // Page mode — plain wrapper, zero overhead
  if (mode === 'page') {
    return <View>{children}</View>;
  }

  // Modal mode — register Y + inject onFocus scroll
  return (
    <View onLayout={(e) => registerFieldY(id, e.nativeEvent.layout.y)}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        const childProps      = child.props as Record<string, unknown>;
        const originalOnFocus = childProps.onFocus as ((...args: unknown[]) => void) | undefined;

        return React.cloneElement(
          child as React.ReactElement<Record<string, unknown>>,
          {
            onFocus: (...args: unknown[]) => {
              scrollToField(id);
              originalOnFocus?.(...args);
            },
          },
        );
      })}
    </View>
  );
});

FormField.displayName = 'FormField';

export default FormField;
