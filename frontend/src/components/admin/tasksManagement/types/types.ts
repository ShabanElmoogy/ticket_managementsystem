import type { KanbanBoard, User, TaskStatus } from "../../../../types/kanban";

export interface TaskFormValues {
  title: string;
  description: string;
  boardId: string;
  columnId: string;
  assigneeId?: string;
  dueDate?: Date | null;
  status: TaskStatus;
}

export interface TaskFormDialogProps {
  open: boolean;
  editing?: boolean;
  initialValues?: TaskFormValues;
  boards: KanbanBoard[];
  users: User[];
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

export interface UseTaskFormArgs {
  open: boolean;
  initialValues?: TaskFormValues;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}
