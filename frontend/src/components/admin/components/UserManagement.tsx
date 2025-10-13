import React from "react";
import { Box, Paper, Typography, Alert, Snackbar, Grid, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import AdminGridHeader from "../../common/AdminGridHeader";
import { UsersTable, UserFormDialog, useUsersManagement } from "../usersManagement";

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

      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Users
                </Typography>
                <Typography variant="h4">{stats.active}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Administrators
                </Typography>
                <Typography variant="h4">{stats.byRole.ADMIN || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Employees
                </Typography>
                <Typography variant="h4">{stats.byRole.EMPLOYEE || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

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
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{deleteDialog.user?.name}"? This action cannot be undone.
          </Typography>
          {deleteDialog.user?._count &&
            (deleteDialog.user._count.assignedTickets > 0 ||
              deleteDialog.user._count.createdTickets > 0 ||
              deleteDialog.user._count.comments > 0) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This user has associated data (tickets or comments). Deletion may fail if there are dependencies.
              </Alert>
            )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteDialog.loading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
