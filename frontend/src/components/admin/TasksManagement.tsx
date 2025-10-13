import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Typography,
} from "@mui/material";
import TasksTable from "./tasksManagement/TasksTable";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuthStore } from "../../stores/authStore";
import type {
  KanbanTask,
  KanbanBoard,
  User,
  TaskStatus,
} from "../../types/kanban";
import DeleteConfirmDialog from "../common/DeleteConfirmDialog";
import AdminGridHeader from "../common/AdminGridHeader";

interface CreateTaskData {
  title: string;
  description: string;
  boardId: string;
  columnId: string;
  assigneeId?: string;
  dueDate?: Date | null;
  status: TaskStatus;
}

const TasksManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [formData, setFormData] = useState<CreateTaskData>({
    title: "",
    description: "",
    boardId: "",
    columnId: "",
    assigneeId: "",
    dueDate: null,
    status: "TODO",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    task: null as KanbanTask | null,
    loading: false,
  });

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchTasks = async () => {
    if (!token) return;

    try {
      console.log("Fetching tasks...");
      const response = await fetch("/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const tasksData = await response.json();
        console.log("Fetched tasks:", tasksData);
        setTasks(tasksData);
      } else {
        console.error(
          "Failed to fetch tasks:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchBoards = async () => {
    if (!token) return;

    try {
      setBoardsLoading(true);
      console.log(
        "Fetching boards with token:",
        token ? "Token exists" : "No token"
      );

      const response = await fetch("/api/kanban/boards", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Boards API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Boards API error response:", errorText);
        throw new Error(
          `Failed to fetch boards: ${response.status} ${response.statusText}`
        );
      }

      const boardsData = await response.json();
      console.log("Fetched boards raw data:", boardsData);
      console.log("Number of boards:", boardsData?.length || 0);

      if (Array.isArray(boardsData)) {
        setBoards(boardsData);
        console.log("Boards set successfully");
      } else {
        console.error("Boards data is not an array:", typeof boardsData);
        setBoards([]);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
      showSnackbar(
        "Error fetching boards: " +
          (error instanceof Error ? error.message : "Unknown error"),
        "error"
      );
      setBoards([]);
    } finally {
      setBoardsLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;

    try {
      console.log("Fetching users...");
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const usersData = await response.json();
        console.log("Fetched users:", usersData);
        setUsers(usersData);
      } else {
        console.error(
          "Failed to fetch users:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchData = async () => {
    if (!token) {
      console.log("No token available, skipping data fetch");
      return;
    }

    try {
      setLoading(true);
      console.log("Starting data fetch...");

      await Promise.all([fetchTasks(), fetchUsers(), fetchBoards()]);

      console.log("Data fetch completed");
    } catch (error) {
      console.error("Error in fetchData:", error);
      showSnackbar("Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      "TasksManagement component mounted, token:",
      token ? "exists" : "missing"
    );
    fetchData();
  }, [token]);

  useEffect(() => {
    console.log("Boards state updated:", boards);
  }, [boards]);

  const getTaskBoards = () => {
    const taskBoards = boards.filter((board) => board.type === "TASKS");
    console.log("Filtering task boards from", boards.length, "total boards");
    console.log("Task boards found:", taskBoards);
    return taskBoards;
  };

  const getColumnsForBoard = (boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    console.log("Getting columns for board", boardId, ":", board?.columns);
    return board?.columns || [];
  };

  const handleOpenDialog = (task?: KanbanTask) => {
    console.log("Opening dialog, current boards:", boards);
    console.log("Task boards available:", getTaskBoards());

    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        boardId: task.boardId,
        columnId: task.columnId,
        assigneeId: task.assignee?.id || "",
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        status: task.status,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        boardId: "",
        columnId: "",
        assigneeId: "",
        dueDate: null,
        status: "TODO",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async () => {
    if (!token) return;

    try {
      const submitData = {
        ...formData,
        assigneeId: formData.assigneeId || undefined,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : undefined,
      };

      if (editingTask) {
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        showSnackbar("Task updated successfully", "success");
      } else {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          throw new Error("Failed to create task");
        }

        showSnackbar("Task created successfully", "success");
      }

      handleCloseDialog();
      fetchTasks();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error saving task",
        "error"
      );
    }
  };

  const handleDeleteClick = (task: KanbanTask) => {
    setDeleteDialog({
      open: true,
      task,
      loading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteDialog.task) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch(`/api/tasks/${deleteDialog.task.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      showSnackbar("Task deleted successfully", "success");
      setDeleteDialog({ open: false, task: null, loading: false });
      fetchTasks();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error deleting task",
        "error"
      );
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, task: null, loading: false });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <AdminGridHeader
          title="Tasks Management"
          onAdd={handleOpenDialog}
          addLabel="Add Task"
        />
        {/* Debug info */}
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: "background.paper",
            borderRadius: 1,
            border: "1px solid #ddd",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>Debug Info:</strong>
            <br />
            Token: {token ? "✓ Available" : "✗ Missing"}
            <br />
            Total boards: {boards.length}
            <br />
            Task boards: {getTaskBoards().length}
            <br />
            Boards loading: {boardsLoading ? "Yes" : "No"}
            <br />
            Users: {users.length}
            <br />
            Tasks: {tasks.length}
          </Typography>
          {boards.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Available boards:</strong>
              </Typography>
              {boards.map((board) => (
                <Typography
                  key={board.id}
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  - {board.name} (Type: {board.type || "Unknown"})
                </Typography>
              ))}
            </Box>
          )}
        </Box>

        <TasksTable
          tasks={tasks}
          loading={loading}
          onEdit={(task) => handleOpenDialog(task)}
          onDelete={(task) => handleDeleteClick(task)}
        />

        {/* Create/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingTask ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
            >
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                fullWidth
                autoComplete="off"
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                multiline
                rows={4}
                required
                fullWidth
                autoComplete="off"
              />
              <FormControl fullWidth required>
                <InputLabel>Board</InputLabel>
                <Select
                  value={formData.boardId}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      boardId: e.target.value,
                      columnId: "", // Reset column when board changes
                    });
                  }}
                  inputProps={{ autoComplete: "off" }}
                >
                  {getTaskBoards().map((board) => (
                    <MenuItem key={board.id} value={board.id}>
                      {board.name} ({board.type})
                    </MenuItem>
                  ))}
                  {getTaskBoards().length === 0 && (
                    <MenuItem disabled value="">
                      No task boards available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              <FormControl fullWidth required disabled={!formData.boardId}>
                <InputLabel>Column</InputLabel>
                <Select
                  value={formData.columnId}
                  onChange={(e) =>
                    setFormData({ ...formData, columnId: e.target.value })
                  }
                  inputProps={{ autoComplete: "off" }}
                >
                  {getColumnsForBoard(formData.boardId).map((column) => (
                    <MenuItem key={column.id} value={column.id}>
                      {column.name}
                    </MenuItem>
                  ))}
                  {formData.boardId &&
                    getColumnsForBoard(formData.boardId).length === 0 && (
                      <MenuItem disabled value="">
                        No columns available for this board
                      </MenuItem>
                    )}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as TaskStatus,
                    })
                  }
                  inputProps={{ autoComplete: "off" }}
                >
                  <MenuItem value="TODO">To Do</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="REVIEW">Review</MenuItem>
                  <MenuItem value="DONE">Done</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={formData.assigneeId}
                  onChange={(e) =>
                    setFormData({ ...formData, assigneeId: e.target.value })
                  }
                  inputProps={{ autoComplete: "off" }}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={(date) => setFormData({ ...formData, dueDate: date })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={
                !formData.title ||
                !formData.description ||
                !formData.boardId ||
                !formData.columnId
              }
            >
              {editingTask ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          itemName={deleteDialog.task?.title}
          itemType="task"
          loading={deleteDialog.loading}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default TasksManagement;
