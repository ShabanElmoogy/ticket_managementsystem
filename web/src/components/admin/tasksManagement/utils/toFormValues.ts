import type { KanbanTask } from '../../kanban/types/types';
import type { TaskFormValues } from '../types/types';

export function taskToFormValues(t: KanbanTask): TaskFormValues {
  return {
    title:       t.title,
    description: t.description,
    boardId:     t.boardId,
    columnId:    t.columnId,
    assigneeId:  t.assignee?.id ?? '',
    dueDate:     t.dueDate ? new Date(t.dueDate) : null,
    status:      t.status,
  };
}
