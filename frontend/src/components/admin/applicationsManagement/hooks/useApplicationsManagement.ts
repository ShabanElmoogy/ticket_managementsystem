import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../../../../stores/authStore";
import { apiService, type Application, type CreateApplicationData } from "../../../../services/api";
import type { DeleteDialogState, SnackbarState } from "../types/types";



export interface ApplicationsControllerReturn {
  applications: Application[];
  loading: boolean;

  dialogOpen: boolean;
  editingApplication: Application | null;
  formData: CreateApplicationData;

  snackbar: SnackbarState;
  deleteDialog: DeleteDialogState;

  handleOpenDialog: (application?: Application) => void;
  handleCloseDialog: () => void;
  handleSubmit: (values: CreateApplicationData) => Promise<void>;

  handleDeleteClick: (application: Application) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;

  handleSnackbarClose: () => void;
  refetch: () => Promise<void>;
}

const DEFAULT_FORM_VALUES: CreateApplicationData = {
  name: "",
  description: "",
  version: "",
};

export function useApplicationsManagement(): ApplicationsControllerReturn {
  const { token } = useAuthStore();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [formData, setFormData] = useState<CreateApplicationData>(DEFAULT_FORM_VALUES);

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, application: null, loading: false });

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchData = useCallback(async () => {
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
  }, [token, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = useCallback((application?: Application) => {
    if (application) {
      setEditingApplication(application);
      setFormData({
        name: application.name,
        description: application.description || "",
        version: application.version || "",
      });
    } else {
      setEditingApplication(null);
      setFormData(DEFAULT_FORM_VALUES);
    }
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingApplication(null);
  }, []);

  const handleSubmit = useCallback(async (values: CreateApplicationData) => {
    if (!token) return;
    try {
      if (editingApplication) {
        await apiService.updateApplication(token, editingApplication.id, values);
        showSnackbar("Application updated successfully", "success");
      } else {
        await apiService.createApplication(token, values);
        showSnackbar("Application created successfully", "success");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : "Error saving application", "error");
    }
  }, [token, editingApplication, handleCloseDialog, fetchData, showSnackbar]);

  const handleDeleteClick = useCallback((application: Application) => {
    setDeleteDialog({ open: true, application, loading: false });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !deleteDialog.application) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      await apiService.deleteApplication(token, deleteDialog.application.id);
      showSnackbar("Application deleted successfully", "success");
      setDeleteDialog({ open: false, application: null, loading: false });
      fetchData();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : "Error deleting application", "error");
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  }, [token, deleteDialog.application, fetchData, showSnackbar]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ open: false, application: null, loading: false });
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return {
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
    refetch: fetchData,
  };
}

export default useApplicationsManagement;
