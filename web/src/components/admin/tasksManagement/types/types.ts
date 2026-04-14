import type { KanbanTask, TaskStatus } from '../../../kanban/types/types';

export interface TaskFormValues {
  title: string;
  description: string;
  boardId: string;
  columnId: string;
  assigneeId?: string;
  dueDate?: Date | null;
  status: TaskStatus;
}

export interface TasksTableProps {
  tasks: KanbanTask[];
  loading: boolean;
  onEdit: (task: KanbanTask) => void;
  onDelete: (task: KanbanTask) => void;
}
