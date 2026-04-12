import { Box, Snackbar, Alert } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { useAdminFeature } from '../../../shared/hooks/useAdminFeature';
import { useAuxData } from '../../../shared/hooks/useAuxData';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { DeleteConfirmDialog, MyGridHeader } from '../../common';
import { TasksTable, TaskFormDialog } from '../tasksManagement';
import { tasksApi } from '../tasksManagement/api/tasks';
import { tasksKeys } from '../tasksManagement/api/queryKeys';
import { taskToFormValues } from '../tasksManagement/utils/toFormValues';
import type { KanbanTask, KanbanBoard, User, TaskStatus } from '../../kanban/types/types';
import type { TaskFormValues } from '../tasksManagement/types/types';

export default function TasksManagement() {
  const f = useAdminFeature<KanbanTask, Partial<KanbanTask>>({
    entityName: 'tasks',
    queryKey: tasksKeys.all,
    api: {
      getAll:  tasksApi.getTasks.bind(tasksApi),
      create:  tasksApi.createTask.bind(tasksApi),
      update:  tasksApi.updateTask.bind(tasksApi),
      delete:  tasksApi.deleteTask.bind(tasksApi),
    },
    messages: {
      success: { created: 'Task created successfully', updated: 'Task updated successfully', deleted: 'Task deleted successfully' },
      error:   { create:  'Error creating task',       update:  'Error updating task',       delete:  'Error deleting task'       },
      titles:  { create:  'Create New Task',           edit:    'Edit Task'                                                       },
    },
  });

  const { data: boards = [], isLoading: boardsLoading } = useAuxData<KanbanBoard[]>(
    ['tasks-boards'],
    tasksApi.getBoards.bind(tasksApi),
  );
  const { data: users = [], isLoading: usersLoading } = useAuxData<User[]>(
    ['tasks-users'],
    tasksApi.getUsers.bind(tasksApi),
  );
  const auxLoading = boardsLoading || usersLoading;

  const handleSubmit = async (values: TaskFormValues) => {
    const { assigneeId, ...rest } = values;
    const submitData: Partial<KanbanTask> = {
      ...rest,
      assignee: assigneeId ? { id: assigneeId, name: '', email: '' } : undefined,
      dueDate:  values.dueDate ? values.dueDate.toISOString() : undefined,
      status:   values.status as TaskStatus,
    };
    await f.handleSubmit(submitData as unknown as Partial<KanbanTask>);
  };

  const initialValues = f.ui.editingItem
    ? taskToFormValues(f.ui.editingItem)
    : undefined;

  return (
    <ErrorBoundary>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box>
          <MyGridHeader
            title="Tasks Management"
            onAdd={() => f.openDialog()}
            addButtonText="Add Task"
            addTooltip="Add Task"
            icon={AddTaskIcon}
          />

          <TasksTable
            tasks={f.entities}
            loading={f.loading || auxLoading}
            onEdit={f.openDialog}
            onDelete={f.openDeleteDialog}
          />

          <TaskFormDialog
            open={f.ui.dialogOpen}
            editing={!!f.ui.editingItem}
            initialValues={initialValues}
            boards={boards}
            users={users}
            onClose={f.closeDialog}
            onSubmit={handleSubmit}
            submitting={f.ui.submitting}
          />

          <DeleteConfirmDialog
            open={f.ui.deleteDialog.open}
            onClose={f.closeDeleteDialog}
            onConfirm={() => f.handleDeleteConfirm((t) => t.id)}
            itemName={f.ui.deleteDialog.item?.title}
            itemType="task"
            loading={false}
          />

          <Snackbar open={f.ui.snackbar.open} autoHideDuration={6000} onClose={f.closeSnackbar}>
            <Alert onClose={f.closeSnackbar} severity={f.ui.snackbar.severity}>
              {f.ui.snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </LocalizationProvider>
    </ErrorBoundary>
  );
}
