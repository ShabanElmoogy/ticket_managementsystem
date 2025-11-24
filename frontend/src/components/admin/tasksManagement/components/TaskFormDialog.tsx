import React, { useMemo } from "react";
import { ReusableFormDialog } from "../../../common/forms";
import type { FormField, SelectOption } from "../../../common/forms";
import type { TaskFormDialogProps, TaskFormValues } from "../types/types";
import { taskFormSchema } from "../schemas/taskSchema";

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
        .filter((b) => b.type === "TASKS")
        .map((b) => ({ value: b.id, label: `${b.name} (${b.type})` })),
    [boards]
  );

  // Convert users to SelectOption format
  const userOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...users.map((u) => ({ value: u.id, label: u.name })),
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
      onClear: () => {
        // Board clear will be handled by form reset
      },
    },
    {
      name: "columnId",
      label: "Column",
      type: "customSelect",
      required: true,
      dependsOn: "boardId",
      disabled: (values) => !values.boardId,
      filterOptions: (options, values) => {
        const selectedBoard = boards.find((b) => b.id === values.boardId);
        return selectedBoard?.columns?.map((c) => ({ value: c.id, label: c.name })) || [];
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
      onClear: () => {
        // Assignee clear will be handled by form
      },
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
