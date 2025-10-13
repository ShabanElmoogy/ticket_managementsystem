import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ApplicationFormValues, UseApplicationFormArgs } from "../types/types";
import { applicationFormSchema } from "../utils/validation";

const DEFAULT_VALUES: ApplicationFormValues = {
  name: "",
  description: "",
  version: "",
};

export function useApplicationForm({ open, initialValues, onSubmit }: UseApplicationFormArgs) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    mode: "onChange",
    defaultValues: initialValues || DEFAULT_VALUES,
  });

  // Reset form when dialog opens or initial values reference changes
  useEffect(() => {
    if (open) {
      reset(initialValues || DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
    }
  }, [open, initialValues, reset]);

  
  const submit = handleSubmit(onSubmit);

  return {
    register,
    submit,
    reset,
    errors,
    isValid,
  } as const;
}

export default useApplicationForm;
