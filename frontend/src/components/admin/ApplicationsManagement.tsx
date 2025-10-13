import React, { useState, useEffect } from "react";
import {
  Box,
  Alert,
  Snackbar,
} from "@mui/material";
import ApplicationsTable  from "./applicationsManagement/ApplicationsTable";
import { useAuthStore } from "../../stores/authStore";
import {
  apiService,
  type Application,
  type CreateApplicationData,
} from "../../services/api";
import DeleteConfirmDialog from "../common/DeleteConfirmDialog";
import AdminGridHeader from "../common/AdminGridHeader";
import ApplicationFormDialog  from "./applicationsManagement/ApplicationFormDialog";

const ApplicationsManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<Application | null>(null);
  const [formData, setFormData] = useState<CreateApplicationData>({
    name: "",
    description: "",
    version: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    application: null as Application | null,
    loading: false,
  });

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const applicationsData = await apiService.getApplications(token);
      setApplications(applicationsData);
    } catch (error) {
      showSnackbar("Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (application?: Application) => {
    if (application) {
      setEditingApplication(application);
      setFormData({
        name: application.name,
        description: application.description || "",
        version: application.version || "",
      });
    } else {
      setEditingApplication(null);
      setFormData({
        name: "",
        description: "",
        version: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingApplication(null);
  };

  const handleSubmit = async (values: CreateApplicationData) => {
    if (!token) return;

    try {
      if (editingApplication) {
        await apiService.updateApplication(
          token,
          editingApplication.id,
          values
        );
        showSnackbar("Application updated successfully", "success");
      } else {
        await apiService.createApplication(token, values);
        showSnackbar("Application created successfully", "success");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error saving application",
        "error"
      );
    }
  };

  const handleDeleteClick = (application: Application) => {
    setDeleteDialog({
      open: true,
      application,
      loading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteDialog.application) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await apiService.deleteApplication(token, deleteDialog.application.id);
      showSnackbar("Application deleted successfully", "success");
      setDeleteDialog({ open: false, application: null, loading: false });
      fetchData();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error deleting application",
        "error"
      );
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, application: null, loading: false });
  };

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

      {/* Create/Edit Dialog */}
      <ApplicationFormDialog
        open={dialogOpen}
        editing={!!editingApplication}
        initialValues={formData}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation Dialog */}
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
  );
};

export default ApplicationsManagement;
