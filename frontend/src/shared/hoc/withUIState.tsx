import React, { useState, useCallback } from "react";

export interface UIState {
  dialogOpen: boolean;
  editingItem: unknown | null;
  submitting: boolean;
  snackbar: {
    open: boolean;
    message: string;
    severity: "success" | "error";
  };
  deleteDialog: {
    open: boolean;
    item: unknown | null;
  };
}

export interface UIStateProps {
  uiState: UIState;
  openDialog: (item?: unknown) => void;
  closeDialog: () => void;
  showSnackbar: (message: string, severity: "success" | "error") => void;
  closeSnackbar: () => void;
  openDeleteDialog: (item: unknown) => void;
  closeDeleteDialog: () => void;
  setSubmitting: (submitting: boolean) => void;
}

const initialUIState: UIState = {
  dialogOpen: false,
  editingItem: null,
  submitting: false,
  snackbar: { open: false, message: "", severity: "success" },
  deleteDialog: { open: false, item: null },
};

export function withUIState<P extends object = Record<string, never>>(
  Component: React.ComponentType<P & UIStateProps>
) {
  const UIStateWrapper = (props: P) => {
    const [uiState, setUIState] = useState<UIState>(initialUIState);

    const openDialog = useCallback((item?: unknown) => {
      setUIState(prev => ({
        ...prev,
        dialogOpen: true,
        editingItem: item || null,
      }));
    }, []);

    const closeDialog = useCallback(() => {
      setUIState(prev => ({
        ...prev,
        dialogOpen: false,
        editingItem: null,
      }));
    }, []);

    const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
      setUIState(prev => ({
        ...prev,
        snackbar: { open: true, message, severity },
      }));
    }, []);

    const closeSnackbar = useCallback(() => {
      setUIState(prev => ({
        ...prev,
        snackbar: { ...prev.snackbar, open: false },
      }));
    }, []);

    const openDeleteDialog = useCallback((item: unknown) => {
      setUIState(prev => ({
        ...prev,
        deleteDialog: { open: true, item },
      }));
    }, []);

    const closeDeleteDialog = useCallback(() => {
      setUIState(prev => ({
        ...prev,
        deleteDialog: { open: false, item: null },
      }));
    }, []);

    const setSubmitting = useCallback((submitting: boolean) => {
      setUIState(prev => ({ ...prev, submitting }));
    }, []);

    const uiProps: UIStateProps = {
      uiState,
      openDialog,
      closeDialog,
      showSnackbar,
      closeSnackbar,
      openDeleteDialog,
      closeDeleteDialog,
      setSubmitting,
    };

    return <Component {...props} {...uiProps} />;
  };

  UIStateWrapper.displayName = `withUIState(${Component.displayName || Component.name})`;
  return UIStateWrapper;
}

export default withUIState;