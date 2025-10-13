import React from "react";
import { Box, Alert, Snackbar } from "@mui/material";
import { ApplicationsTable, ApplicationFormDialog } from "../applicationsManagement";
import DeleteConfirmDialog from "../../common/DeleteConfirmDialog";
import AdminGridHeader from "../../common/AdminGridHeader";
import useApplicationsManagement from "../applicationsManagement/hooks/useApplicationsManagement";

const ApplicationsManagement: React.FC = () => {
  const {
    applications,
    loading,

    dialogOpen,
    editingApplication,
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
  } = useApplicationsManagement();

  return (
    <Box>
      <AdminGridHeader
        title="Applications Management"
        onAdd={handleOpenDialog}
        addLabel="Add Application"
      />

      <ApplicationsTable
        applications={applications}
        loading={loading}
        onEdit={(app) => handleOpenDialog(app)}
        onDelete={(app) => handleDeleteClick(app)}
      />

      <ApplicationFormDialog
        open={dialogOpen}
        editing={!!editingApplication}
        initialValues={formData}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.application?.name}
        itemType="application"
        loading={deleteDialog.loading}
        warningMessage={
          deleteDialog.application?._count?.tickets &&
          deleteDialog.application._count.tickets > 0
            ? `This application has ${deleteDialog.application._count.tickets} associated ticket(s). Please reassign or delete them first.`
            : undefined
        }
      />

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
  );
};

export default ApplicationsManagement;
