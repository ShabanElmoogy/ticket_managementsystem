import React from "react";
import { Box, Paper, Alert, Snackbar } from "@mui/material";
import AdminGridHeader from "../../common/AdminGridHeader";
import DeleteConfirmDialog from "../../common/DeleteConfirmDialog";
import { UsersTable, UserFormDialog, useUsersManagement } from "../usersManagement";
import UsersStatsCards from "../usersManagement/components/UsersStatsCards";

const UserManagement: React.FC = () => {
  const {
    users,
    stats,
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
    handleSnackbarClose,
  } = useUsersManagement();

  return (
    <Box>
      <AdminGridHeader title="Users Management" onAdd={() => handleOpenDialog()} addLabel="Add User" />

      {/* {stats && <UsersStatsCards stats={stats} />} */}

      <Paper sx={{ height: 600, width: "100%" }}>
        <UsersTable users={users} loading={loading} onEdit={(u) => handleOpenDialog(u)} onDelete={handleDeleteClick} />
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
            ? `This user has associated data: ${deleteDialog.user._count.assignedTickets || 0} assigned ticket(s), ${deleteDialog.user._count.createdTickets || 0} created ticket(s), ${deleteDialog.user._count.comments || 0} comment(s). Deletion may fail if there are dependencies.`
            : undefined
        }
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
