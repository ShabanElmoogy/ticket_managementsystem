import React, { useId } from 'react';
import { View } from 'react-native';
import { useFormScroll } from './FormScrollContext';

interface Props {
  children: React.ReactNode;
}

/**
 * FormField — wraps a single form input.
 * Registers its Y position with FormScrollProvider on layout.
 * Children call scrollToField via useFormScroll() on focus.
 *
 * Usage — replace bare inputs with:
 *   <FormField>
 *     <AppTextInput ... />
 *   </FormField>
 */
const FormField: React.FC<Props> = ({ children }) => {
  const id = useId();
  const { registerFieldY, scrollToField } = useFormScroll();

  return (
    <View onLayout={(e) => registerFieldY(id, e.nativeEvent.layout.y)}>
      {/* Inject scrollToField into the direct child via context-aware clone */}
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<any>, {
          onFocus: (...args: any[]) => {
            scrollToField(id);
            (child as React.ReactElement<any>).props.onFocus?.(...args);
          },
        });
      })}
    </View>
  );
};

export default FormField;
