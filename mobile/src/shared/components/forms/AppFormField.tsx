import React, { useRef } from 'react';
import { View } from 'react-native';
import { Controller, useFormContext, type Control, type FieldValues, type Path } from 'react-hook-form';
import { useFormFocus } from './FormFocusContext';

interface AppFormFieldProps<T extends FieldValues> {
  name:       Path<T>;
  control:    Control<T>;
  children?:  React.ReactElement;
  transform?: (v: string) => string;
}

function AppFormField<T extends FieldValues>({
  name, control, children, transform,
}: AppFormFieldProps<T>) {
  const formContext  = useFormContext<T>();
  const trigger      = formContext?.trigger;
  const { registerRef, registerY } = useFormFocus();

  // Register inputRef from child into FormFocusContext
  const childInputRef = (children?.props as any)?.inputRef as React.RefObject<any> | undefined;
  if (childInputRef) registerRef(String(name), childInputRef);

  return (
    <View onLayout={(e: any) => registerY(String(name), e.nativeEvent.layout.y)}>
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => {
          const originalNextRef = (children?.props as any)?.nextRef as React.RefObject<any> | undefined;

          // Wrap nextRef: validate this field before moving to next
          const wrappedNextRef = originalNextRef
            ? {
                current: {
                  focus: async () => {
                    const valid = trigger ? await trigger(name) : true;
                    if (valid) originalNextRef.current?.focus();
                  },
                },
              }
            : undefined;

          return React.cloneElement(children! as any, {
            value:        value ?? '',
            onChangeText: (v: string) => onChange(transform ? transform(v) : v),
            onBlur,
            error:        error?.message,
            // Wire onClear to RHF onChange so clearing updates the form state
            onClear:      () => onChange(''),
            ...(wrappedNextRef ? { nextRef: wrappedNextRef } : {}),
          });
        }}
      />
    </View>
  );
}

export default AppFormField;
