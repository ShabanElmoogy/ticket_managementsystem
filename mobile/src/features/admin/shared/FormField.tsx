import React, { useRef } from 'react';
import { View } from 'react-native';
import { useFormScroll } from './FormScrollContext';

/**
 * Module-level counter — incremented once per FormField mount, never on re-render.
 * Produces stable IDs like "field_1", "field_2", etc.
 */
let fieldCounter = 0;

interface FormFieldProps {
  children: React.ReactNode;
  /** Optional semantic ID — e.g. "name", "version". Used by scrollToFirstError. */
  fieldId?: string;
}

/**
 * FormField — wraps a single form input.
 *
 * - Registers its Y position with FormScrollProvider on layout.
 * - Injects an onFocus handler into the direct child so scroll happens automatically.
 * - Uses a module-level counter for stable IDs — no useId(), no re-render churn.
 * - Wrapped in React.memo to prevent re-renders when the parent re-renders.
 */
const FormField: React.FC<FormFieldProps> = React.memo(({ children, fieldId }) => {
  // Stable ID: computed once on first render, never changes
  const id = useRef(fieldId ?? `field_${++fieldCounter}`).current;
  const { registerFieldY, scrollToField } = useFormScroll();

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
