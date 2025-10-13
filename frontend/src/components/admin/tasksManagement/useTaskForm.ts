import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TaskFormValues, UseTaskFormArgs } from "./types";
import { taskFormSchema } from "./validation";

const DEFAULT_VALUES: TaskFormValues = {
  title: "",
  description: "",
  boardId: "",
  columnId: "",
  assigneeId: "",
  dueDate: null,
  status: "TODO",
};

export function useTaskForm({ open, initialValues, onSubmit }: UseTaskFormArgs) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
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
    watch,
    setValue,
  } as const;
}

export default useTaskForm;