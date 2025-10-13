import type { TaskStatus, KanbanBoard, User } from "../../../types/kanban";

export type TaskFormValues = {
  title: string;
  description: string;
  boardId: string;
  columnId: string;
  assigneeId?: string;
  dueDate?: Date | null;
  status: TaskStatus;
};

export interface TaskFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: TaskFormValues;
  boards: KanbanBoard[];
  users: User[];
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

export interface UseTaskFormArgs {
  open: boolean;
  initialValues?: TaskFormValues;
  onSubmit: (values: TaskFormValues) => void;
}