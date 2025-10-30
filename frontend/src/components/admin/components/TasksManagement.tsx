import React from "react";
import { Box, Alert, Snackbar } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DeleteConfirmDialog from "../../common/DeleteConfirmDialog";
import { TasksTable, TaskFormDialog } from "../tasksManagement";
import useTasksManagement from "../tasksManagement/hooks/useTasksManagement";
import MyGridHeader from "../../common/MyGridHeader";
import AddTaskIcon from "@mui/icons-material/AddTask";

const TasksManagement: React.FC = () => {
  const {
    tasks,
    boards,
    users,
    loading,
    boardsLoading,

    dialogOpen,
    editingTask,
    formInitialValues,

    snackbar,
    deleteDialog,

    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,

    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,

    handleSnackbarClose,
  } = useTasksManagement();

  const getTaskBoards = () => boards.filter((board) => board.type === "TASKS");

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <MyGridHeader
          title="Tasks Management"
          onAdd={handleOpenDialog}
          addButtonText="Add Task"
          addTooltip="Add Task"
          icon={AddTaskIcon}
        />

        <TasksTable
          tasks={tasks}
          loading={loading}
          onEdit={(task) => handleOpenDialog(task)}
          onDelete={(task) => handleDeleteClick(task)}
        />

        <TaskFormDialog
          open={dialogOpen}
          editing={!!editingTask}
          initialValues={formInitialValues}
          boards={boards}
          users={users}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
        />

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
          onClose={handleSnackbarClose}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default TasksManagement;
