import { useEffect, useState, useCallback } from "react";
import type { KanbanTask, KanbanBoard, User, TaskStatus } from "../../../../types/kanban";
import { useAuthStore } from "../../../../stores/authStore";

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

export type DeleteDialogState = {
  open: boolean;
  task: KanbanTask | null;
  loading: boolean;
};

export interface TasksControllerReturn {
  tasks: KanbanTask[];
  boards: KanbanBoard[];
  users: User[];
  loading: boolean;
  boardsLoading: boolean;

  dialogOpen: boolean;
  editingTask: KanbanTask | null;
  formInitialValues?: {
    title: string;
    description: string;
    boardId: string;
    columnId: string;
    assigneeId?: string;
    dueDate?: Date | null;
    status: TaskStatus;
  };

  snackbar: SnackbarState;
  deleteDialog: DeleteDialogState;

  handleOpenDialog: (task?: KanbanTask) => void;
  handleCloseDialog: () => void;
  handleSubmit: (values: {
    title: string;
    description: string;
    boardId: string;
    columnId: string;
    assigneeId?: string;
    dueDate?: Date | null;
    status: TaskStatus;
  }) => Promise<void>;

  handleDeleteClick: (task: KanbanTask) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;

  handleSnackbarClose: () => void;
  refetch: () => Promise<void>;
}

export function useTasksManagement(): TasksControllerReturn {
  const { token } = useAuthStore();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardsLoading, setBoardsLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, task: null, loading: false });

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchBoards = useCallback(async () => {
    if (!token) return;
    try {
      setBoardsLoading(true);
      const res = await fetch("/api/kanban/boards", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch boards");
      const data = await res.json();
      setBoards(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showSnackbar("Error fetching boards", "error");
      setBoards([]);
    } finally {
      setBoardsLoading(false);
    }
  }, [token, showSnackbar]);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchUsers(), fetchBoards()]);
    } catch (err) {
      console.error(err);
      showSnackbar("Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  }, [token, fetchTasks, fetchUsers, fetchBoards, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = useCallback((task?: KanbanTask) => {
    if (task) setEditingTask(task); else setEditingTask(null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingTask(null);
  }, []);

  const handleSubmit = useCallback(async (values: {
    title: string;
    description: string;
    boardId: string;
    columnId: string;
    assigneeId?: string;
    dueDate?: Date | null;
    status: TaskStatus;
  }) => {
    try {
      const submitData = {
        ...values,
        assigneeId: values.assigneeId || undefined,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      };

      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
        if (!res.ok) throw new Error("Failed to update task");
        showSnackbar("Task updated successfully", "success");
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
        if (!res.ok) throw new Error("Failed to create task");
        showSnackbar("Task created successfully", "success");
      }

      handleCloseDialog();
      fetchTasks();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : "Error saving task", "error");
    }
  }, [editingTask, fetchTasks, handleCloseDialog, showSnackbar]);

  const handleDeleteClick = useCallback((task: KanbanTask) => {
    setDeleteDialog({ open: true, task, loading: false });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDialog.task) return;
    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/tasks/${deleteDialog.task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      showSnackbar("Task deleted successfully", "success");
      setDeleteDialog({ open: false, task: null, loading: false });
      fetchTasks();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : "Error deleting task", "error");
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  }, [deleteDialog.task, fetchTasks, showSnackbar]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ open: false, task: null, loading: false });
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    tasks,
    boards,
    users,
    loading,
    boardsLoading,

    dialogOpen,
    editingTask,
    formInitialValues: editingTask ? {
      title: editingTask.title,
      description: editingTask.description,
      boardId: editingTask.boardId,
      columnId: editingTask.columnId,
      assigneeId: editingTask.assignee?.id || "",
      dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : null,
      status: editingTask.status as TaskStatus,
    } : undefined,

    snackbar,
    deleteDialog,

    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,

    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,

    handleSnackbarClose,
    refetch: fetchData,
  };
}

export default useTasksManagement;
