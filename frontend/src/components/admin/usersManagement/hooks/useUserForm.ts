import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseUserFormArgs, UserFormValues } from "../types/types";
import { userFormSchema } from "../utils/validation";

const DEFAULT_VALUES: UserFormValues = {
  name: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  phone: "",
  whatsappNotifications: false,
};

export function useUserForm({ open, initialValues, editing, onSubmit }: UseUserFormArgs) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    mode: "onChange",
    defaultValues: initialValues || DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues || DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
    }
  }, [open, initialValues, reset]);

  // For create mode, enforce non-empty password before submit
  const submit = handleSubmit((values) => {
    const payload = { ...values };
    if (!editing && (!payload.password || payload.password.trim() === "")) {
      // react-hook-form validation doesn't know about create/edit requiredness, guard here
      // Fallback: set to empty string to reflect as error via schema length rule if needed
      // but we allow empty in schema for edit; so we enforce here.
      return;
    }
    onSubmit(payload);
  });

  return { register, submit, errors, isValid, watch, setValue } as const;
}

export default useUserForm;
