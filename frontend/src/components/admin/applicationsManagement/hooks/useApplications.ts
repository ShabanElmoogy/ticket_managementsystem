import { useCallback, useState } from "react";
import { type Application, type CreateApplicationData } from "../../../../services/api";
import { useApplicationsData } from "./useApplicationsData";
import { messages } from "../utils/messages";
import { getErrorMessage } from "../utils/errorUtils";

interface UIState {
  dialogOpen: boolean;
  editingApplication: Application | null;
  submitting: boolean;
  snackbar: {
    open: boolean;
    message: string;
    severity: "success" | "error";
  };
  deleteDialog: {
    open: boolean;
    application: Application | null;
  };
}

const initialUIState: UIState = {
  dialogOpen: false,
  editingApplication: null,
  submitting: false,
  snackbar: { open: false, message: "", severity: "success" },
  deleteDialog: { open: false, application: null },
};

export function useApplications() {
  const { applications, loading, create, update, remove, refetch } = useApplicationsData();
  const [ui, setUI] = useState<UIState>(initialUIState);

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setUI(prev => ({ ...prev, snackbar: { open: true, message, severity } }));
  }, []);

  const handleOpenDialog = useCallback((application?: Application) => {
    setUI(prev => ({
      ...prev,
      dialogOpen: true,
      editingApplication: application || null,
    }));
  }, []);

  const handleCloseDialog = useCallback(() => {
    setUI(prev => ({
      ...prev,
      dialogOpen: false,
      editingApplication: null,
    }));
  }, []);

  const handleSubmit = useCallback(async (values: CreateApplicationData) => {
    setUI(prev => ({ ...prev, submitting: true }));
    
    try {
      if (ui.editingApplication) {
        await update(ui.editingApplication.id, values);
        showSnackbar(messages.success.updated, "success");
      } else {
        await create(values);
        showSnackbar(messages.success.created, "success");
      }
      handleCloseDialog();
    } catch (error) {
      const errorMessage = ui.editingApplication 
        ? getErrorMessage(error, messages.error.update)
        : getErrorMessage(error, messages.error.create);
      showSnackbar(errorMessage, "error");
      console.error('Application operation failed:', error);
    } finally {
      setUI(prev => ({ ...prev, submitting: false }));
    }
  }, [ui.editingApplication, create, update, showSnackbar, handleCloseDialog]);

  const handleDeleteClick = useCallback((application: Application) => {
    setUI(prev => ({
      ...prev,
      deleteDialog: { open: true, application },
    }));
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!ui.deleteDialog.application) return;
    
    try {
      await remove(ui.deleteDialog.application.id);
      showSnackbar(messages.success.deleted, "success");
      setUI(prev => ({
        ...prev,
        deleteDialog: { open: false, application: null },
      }));
    } catch (error) {
      showSnackbar(getErrorMessage(error, messages.error.delete), "error");
      console.error('Application deletion failed:', error);
    }
  }, [ui.deleteDialog.application, remove, showSnackbar]);

  const handleDeleteCancel = useCallback(() => {
    setUI(prev => ({
      ...prev,
      deleteDialog: { open: false, application: null },
    }));
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setUI(prev => ({
      ...prev,
      snackbar: { ...prev.snackbar, open: false },
    }));
  }, []);

  return {
    // Data
    applications,
    loading,
    refetch,
    
    // UI State
    dialogOpen: ui.dialogOpen,
    editingApplication: ui.editingApplication,
    submitting: ui.submitting,
    snackbar: ui.snackbar,
    deleteDialog: ui.deleteDialog,
    
    // Handlers
    handleOpenDialog,
    handleCloseDialog,
    handleSubmit,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleSnackbarClose,
  };
}

export default useApplications;