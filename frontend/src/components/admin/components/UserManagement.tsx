import React from "react";
import { Box, Paper, Alert, Snackbar } from "@mui/material";
import DeleteConfirmDialog from "../../common/DeleteConfirmDialog";
import ConfirmTextDialog from "../../common/ConfirmTextDialog";
import {
  UsersTable,
  UserFormDialog,
  useUsersManagement,
} from "../usersManagement";
import InterpreterModeIcon from "@mui/icons-material/InterpreterMode";
import MyGridHeader from "../../common/MyGridHeader";

const UserManagement: React.FC = () => {
  const {
    users,
    loading,
    dialogOpen,
    editingUser,
    formData,
    snackbar,
    deleteDialog,
    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleForceDeleteConfirm,
    handleForceDeleteCancel,
    handleSnackbarClose,
  } = useUsersManagement();

  return (
    <Box>
      <MyGridHeader
        title="Users Management"
        onAdd={handleOpenDialog}
        addButtonText="Add User"
        addTooltip="Add User"
        icon={InterpreterModeIcon}
      />

      {/* {stats && <UsersStatsCards stats={stats} />} */}

      <Paper sx={{ height: 600, width: "100%" }}>
        <UsersTable
          users={users}
          loading={loading}
          onEdit={(u) => handleOpenDialog(u)}
          onDelete={handleDeleteClick}
        />
      </Paper>

      <UserFormDialog
        open={dialogOpen}
        editing={!!editingUser}
        initialValues={formData}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.user?.name}
        itemType="user"
        loading={deleteDialog.loading}
        warningMessage={
          deleteDialog.user?._count &&
          (deleteDialog.user._count.assignedTickets > 0 ||
            deleteDialog.user._count.createdTickets > 0 ||
            deleteDialog.user._count.comments > 0)
            ? `This user has associated data: ${
                deleteDialog.user._count.assignedTickets || 0
              } assigned ticket(s), ${
                deleteDialog.user._count.createdTickets || 0
              } created ticket(s), ${
                deleteDialog.user._count.comments || 0
              } comment(s). Deletion may fail if there are dependencies.`
            : undefined
        }
      />

      {/* Force delete confirmation with typed word */}
      <ConfirmTextDialog
        open={!!deleteDialog.forceDialogOpen}
        onClose={handleForceDeleteCancel}
        onConfirm={handleForceDeleteConfirm}
        title="Force Delete User and Related Data"
        message={
          <>
            <Box sx={{ mb: 1 }}>
              You are attempting to delete a user that has related data (tickets, comments, activities, assignments).
            </Box>
            <Box>
              To proceed, type DELETE below. This will:
              <ul>
                <li>Unassign tickets and tasks assigned to the user</li>
                <li>Delete comments and activities by the user</li>
                <li>Delete tickets created by the user</li>
                <li>Remove board permissions and notifications</li>
              </ul>
            </Box>
          </>
        }
        confirmWord="DELETE"
        loading={deleteDialog.loading}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
