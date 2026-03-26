import React from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  withCRUD,
  withUIState,
  withMessages,
  withErrorHandling,
  type CRUDProps,
  type UIStateProps,
  type MessagesProps,
  type ErrorHandlingProps,
} from "../../../shared";
import { DeleteConfirmDialog, MyGridHeader } from "../../common";
import { TasksTable, TaskFormDialog } from "../tasksManagement";
import { tasksApi } from "../tasksManagement/api/tasks";
import type { KanbanTask, KanbanBoard, User, TaskStatus } from "../../kanban/types/types";
import type { TaskFormValues } from "../tasksManagement/types/types";
import AddTaskIcon from "@mui/icons-material/AddTask";

// Define keys for React Query
const tasksKeys = { all: ["tasks"] as const };

interface TasksPageProps
  extends CRUDProps<KanbanTask, Partial<KanbanTask>>,
  UIStateProps,
  MessagesProps,
  ErrorHandlingProps {
  // Add any additional props if needed
}

function TasksPageComponent(props: TasksPageProps) {
  const {
    entities: tasks,
    loading,
    create,
    update,
    remove,
    uiState,
    openDialog,
    closeDialog,
    showSnackbar,
    closeSnackbar,
    openDeleteDialog,
    closeDeleteDialog,
    setSubmitting,
    messages,
    handleError,
    logError,
  } = props;

  const [boards, setBoards] = React.useState<KanbanBoard[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);

  const [auxLoading, setAuxLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchAuxData = async () => {
      setAuxLoading(true);
      try {
        const [boardsData, usersData] = await Promise.all([
          tasksApi.getBoards(),
          tasksApi.getUsers(),
        ]);
        setBoards(boardsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to fetch auxiliary data", error);
      } finally {
        setAuxLoading(false);
      }
    };
    fetchAuxData();
  }, []);

  const handleSubmit = async (values: TaskFormValues) => {
    setSubmitting(true);
    try {
      // Format data if needed (e.g. dueDate)
      const { assigneeId, ...rest } = values;
      const submitData: Partial<KanbanTask> = {
        ...rest,
        assignee: assigneeId ? { id: assigneeId, name: "", email: "" } : undefined,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        status: values.status as TaskStatus,
      };

      if (uiState.editingItem) {
        await update((uiState.editingItem as KanbanTask).id, submitData);
        showSnackbar(messages.success.updated, "success");
      } else {
        await create(submitData);
        showSnackbar(messages.success.created, "success");
      }
      closeDialog();
    } catch (error) {
      const errorMessage = uiState.editingItem
        ? messages.error.update
        : messages.error.create;
      showSnackbar(handleError(error, errorMessage), "error");
      logError(uiState.editingItem ? "Update" : "Create", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!uiState.deleteDialog.item) return;
    try {
      await remove((uiState.deleteDialog.item as KanbanTask).id);
      showSnackbar(messages.success.deleted, "success");
      closeDeleteDialog();
    } catch (error) {
      showSnackbar(handleError(error, messages.error.delete), "error");
      logError("Delete", error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <MyGridHeader
          title="Tasks Management"
          onAdd={() => openDialog()}
          addButtonText="Add Task"
          addTooltip="Add Task"
          icon={AddTaskIcon}
        />

        <TasksTable
          tasks={tasks}
          loading={loading || auxLoading}
          onEdit={openDialog}
          onDelete={openDeleteDialog}
        />

        <TaskFormDialog
          open={uiState.dialogOpen}
          editing={!!uiState.editingItem}
          initialValues={
            uiState.editingItem
              ? {
                title: (uiState.editingItem as KanbanTask).title,
                description: (uiState.editingItem as KanbanTask).description,
                boardId: (uiState.editingItem as KanbanTask).boardId,
                columnId: (uiState.editingItem as KanbanTask).columnId,
                assigneeId: (uiState.editingItem as KanbanTask).assignee?.id || "",
                dueDate: (uiState.editingItem as KanbanTask).dueDate ? new Date((uiState.editingItem as KanbanTask).dueDate!) : null,
                status: (uiState.editingItem as KanbanTask).status,
              }
              : undefined
          }
          boards={boards}
          users={users}
          onClose={closeDialog}
          onSubmit={handleSubmit}
          submitting={uiState.submitting}
        />

        <DeleteConfirmDialog
          open={uiState.deleteDialog.open}
          onClose={closeDeleteDialog}
          onConfirm={handleDeleteConfirm}
          itemName={(uiState.deleteDialog.item as KanbanTask)?.title}
          itemType="task"
          loading={false}
        />

        <Snackbar
          open={uiState.snackbar.open}
          autoHideDuration={6000}
          onClose={closeSnackbar}
        >
          <Alert onClose={closeSnackbar} severity={uiState.snackbar.severity}>
            {uiState.snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}

// Compose HOCs
const TasksManagement = withCRUD(
  withUIState(
    withMessages(withErrorHandling(TasksPageComponent), {
      success: {
        created: "Task created successfully",
        updated: "Task updated successfully",
        deleted: "Task deleted successfully",
      },
      error: {
        create: "Error creating task",
        update: "Error updating task",
        delete: "Error deleting task",
      },
      titles: {
        create: "Create New Task",
        edit: "Edit Task",
      },
    })
  ),
  {
    entityName: "tasks",
    queryKey: tasksKeys.all,
    api: {
      getAll: tasksApi.getTasks.bind(tasksApi),
      create: tasksApi.createTask.bind(tasksApi),
      update: tasksApi.updateTask.bind(tasksApi),
      delete: tasksApi.deleteTask.bind(tasksApi),
    },
  }
) as React.ComponentType;

export default TasksManagement;
