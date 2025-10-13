import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CustomerFormValues, UseCustomerFormArgs } from "./types";
import { customerFormSchema } from "./validation";

const DEFAULT_VALUES: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  description: "",
  applicationIds: [],
};

export function useCustomerForm({ open, initialValues, onSubmit }: UseCustomerFormArgs) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    mode: "onChange",
    defaultValues: initialValues || DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues || DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
    }
  }, [open, initialValues, reset]);

  const submit = handleSubmit(onSubmit);

  return { register, submit, reset, errors, isValid, watch, setValue } as const;
}

export default useCustomerForm;
