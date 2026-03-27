import type { TaskStatus } from "../../../kanban/types/types";

export interface TaskFormValues {
  title: string;
  description: string;
  boardId: string;
  columnId: string;
  assigneeId?: string;
  dueDate?: Date | null;
  status: TaskStatus;
}
