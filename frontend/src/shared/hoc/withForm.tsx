import React from "react";
// Form components will be implemented directly in HOC
// import { ReusableFormDialog, type FormField } from "../../components/common/forms";
import type { ZodSchema } from "zod";

export interface FormField {
  name: string;
  label: string;
  type?: "text" | "multiline" | "email" | "password";
  required?: boolean;
  rows?: number;
}

export interface FormConfig<T> {
  fields: FormField[];
  schema: ZodSchema<T>;
  defaultValues: T;
  titles: {
    create: string;
    edit: string;
  };
}

export interface FormProps<T> {
  formOpen: boolean;
  editingItem: T | null;
  onFormClose: () => void;
  onFormSubmit: (values: T) => void;
  formSubmitting: boolean;
  formConfig: FormConfig<T>;
}

export function withForm<T, P extends object = Record<string, never>>(
  formConfig: FormConfig<T>
) {
  return function(Component: React.ComponentType<P & { renderForm: () => React.ReactNode }>) {
    const FormWrapper = (props: P & FormProps<T>) => {
      const { formOpen, editingItem, onFormClose, onFormSubmit, formSubmitting, ...restProps } = props;
      
      const renderForm = () => (
        <div>Form HOC Implementation - {editingItem ? formConfig.titles.edit : formConfig.titles.create}</div>
      );

      return <Component {...(restProps as P)} renderForm={renderForm} />;
    };

    FormWrapper.displayName = `withForm(${Component.displayName || Component.name})`;
    return FormWrapper;
  };
}

export default withForm;