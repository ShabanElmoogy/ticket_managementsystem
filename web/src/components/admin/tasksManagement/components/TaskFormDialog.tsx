import React, { useMemo } from "react";
import ReusableFormDialog from "../../../../shared/components/forms/ReusableFormDialog";
import type { FormField, SelectOption } from "../../../../shared/components/forms/ReusableFormDialog";
import type { TaskFormValues } from "../types/types";
import { taskFormSchema } from "../schemas/taskSchema";

interface TaskFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: TaskFormValues;
  boards: { id: string; name: string; type: string; columns?: { id: string; name: string }[] }[];
  users: { id: string; name: string }[];
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
  submitting?: boolean;
}

const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  open,
  editing = false,
  initialValues,
  boards,
  users,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  // Filter boards to only show TASKS type
  const taskBoards: SelectOption[] = useMemo(
    () =>
      boards
        .filter((b: { type: string }) => b.type === "TASKS")
        .map((b: { id: string; name: string; type: string }) => ({ value: b.id, label: `${b.name} (${b.type})` })),
    [boards]
  );

  // Convert users to SelectOption format
  const userOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...users.map((u: { id: string; name: string }) => ({ value: u.id, label: u.name })),
    ],
    [users]
  );

  // Status options
  const statusOptions: SelectOption[] = [
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "REVIEW", label: "Review" },
    { value: "DONE", label: "Done" },
  ];

  const taskFields: FormField<TaskFormValues>[] = [
    {
      name: "title",
      label: "Title",
      required: true,
      autoFocus: true,
      width: 1,
    },
    {
      name: "description",
      label: "Description",
      type: "multiline",
      rows: 4,
      required: true,
      width: 1,
    },
    {
      name: "boardId",
      label: "Board",
      type: "customSelect",
      required: true,
      options: taskBoards,
      width: 2,
    },
    {
      name: "columnId",
      label: "Column",
      type: "customSelect",
      required: true,
      dependsOn: "boardId",
      disabled: (values) => !values.boardId,
      filterOptions: (_options, values) => {
        const selectedBoard = boards.find((b: { id: string; columns?: { id: string; name: string }[] }) => b.id === values.boardId);
        return selectedBoard?.columns?.map((c: { id: string; name: string }) => ({ value: c.id, label: c.name })) || [];
      },
      width: 2,
    },
    {
      name: "status",
      label: "Status",
      type: "customSelect",
      options: statusOptions,
      width: 2,
    },
    {
      name: "assigneeId",
      label: "Assignee",
      type: "customSelect",
      options: userOptions,
      width: 2,
    },
    {
      name: "dueDate",
      label: "Due Date",
      type: "datepicker",
      dateFormat: "dd/MM/yyyy",
      width: 1,
    },
  ];

  return (
    <ReusableFormDialog
      open={open}
      title={editing ? "Edit Task" : "Create New Task"}
      editing={editing}
      schema={taskFormSchema}
      fields={taskFields}
      initialValues={
        initialValues || {
          title: "",
          description: "",
          boardId: "",
          columnId: "",
          assigneeId: "",
          dueDate: null,
          status: "TODO",
        }
      }
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
    />
  );
};

export default TaskFormDialog;
