import type { TaskStatus } from "../../../../types/kanban";

export interface TaskFormValues {
  title: string;
  description: string;
  boardId: string;
  columnId: string;
  assigneeId?: string;
  dueDate?: Date | null;
  status: TaskStatus;
}
