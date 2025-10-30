import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../../../../stores/authStore";
import { apiService, type User, type CreateUserData, type UpdateUserData, type UserStats } from "../../../../services/api";
import type { UserFormValues } from "../types/types";

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

export type DeleteDialogState = {
  open: boolean;
  user: User | null;
  loading: boolean;
  forceDialogOpen?: boolean;
};

export interface UsersControllerReturn {
  users: User[];
  stats: UserStats | null;
  loading: boolean;

  dialogOpen: boolean;
  editingUser: User | null;
  formData: UserFormValues;

  snackbar: SnackbarState;
  deleteDialog: DeleteDialogState;

  handleOpenDialog: (user?: User) => void;
  handleCloseDialog: () => void;
  handleSubmit: (values: UserFormValues) => Promise<void>;

  handleDeleteClick: (user: User) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
  handleForceDeleteConfirm: () => Promise<void>;
  handleForceDeleteCancel: () => void;

  handleSnackbarClose: () => void;
  refetch: () => Promise<void>;
}

const DEFAULT_FORM_VALUES: UserFormValues = {
  email: "",
  name: "",
  password: "",
  role: "EMPLOYEE",
  phone: "",
  whatsappNotifications: false,
};

export function useUsersManagement(): UsersControllerReturn {
  const { token } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormValues>(DEFAULT_FORM_VALUES);

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, user: null, loading: false, forceDialogOpen: false });

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        apiService.getUsers(token),
        apiService.getUserStats(token),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      showSnackbar("Error fetching users", "error");
    } finally {
      setLoading(false);
    }
  }, [token, showSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = useCallback((user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        name: user.name,
        password: "",
        role: user.role,
        phone: user.phone || "",
        whatsappNotifications: user.whatsappNotifications || false,
      });
    } else {
      setEditingUser(null);
      setFormData(DEFAULT_FORM_VALUES);
    }
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingUser(null);
  }, []);

  const handleSubmit = useCallback(async (values: UserFormValues) => {
    if (!token) return;
    try {
      if (editingUser) {
        const updateData: UpdateUserData = {
          email: values.email,
          name: values.name,
          role: values.role,
          phone: values.phone?.trim() || undefined,
          whatsappNotifications: values.whatsappNotifications,
        };
        if (values.password && values.password.trim() !== "") {
          updateData.password = values.password;
        }
        await apiService.updateUser(token, editingUser.id, updateData);
        showSnackbar("User updated successfully", "success");
      } else {
        const createData: CreateUserData = {
          email: values.email,
          name: values.name,
          password: values.password || "",
          role: values.role,
          phone: values.phone?.trim() || undefined,
          whatsappNotifications: values.whatsappNotifications,
        };
        await apiService.createUser(token, createData);
        showSnackbar("User created successfully", "success");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : "Error saving user", "error");
    }
  }, [token, editingUser, handleCloseDialog, fetchData, showSnackbar]);

  const handleDeleteClick = useCallback((user: User) => {
    setDeleteDialog({ open: true, user, loading: false });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !deleteDialog.user) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      await apiService.deleteUser(token, deleteDialog.user.id);
      showSnackbar("User deleted successfully", "success");
      setDeleteDialog({ open: false, user: null, loading: false, forceDialogOpen: false });
      fetchData();
    } catch (error) {
      // If deletion fails due to related data, open force dialog
      const msg = error instanceof Error ? error.message : "Error deleting user";
      const relatedDataError = msg.toLowerCase().includes('associated tickets') || msg.toLowerCase().includes('associated data');
      if (relatedDataError) {
        setDeleteDialog((prev) => ({ ...prev, loading: false, open: false, forceDialogOpen: true }));
      } else {
        showSnackbar(msg, "error");
        setDeleteDialog((prev) => ({ ...prev, loading: false }));
      }
    }
  }, [token, deleteDialog.user, fetchData, showSnackbar]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ open: false, user: null, loading: false, forceDialogOpen: false });
  }, []);

  const handleForceDeleteConfirm = useCallback(async () => {
    if (!token || !deleteDialog.user) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      await apiService.deleteUser(token, deleteDialog.user.id, { force: true });
      showSnackbar("User and related data deleted successfully", "success");
      setDeleteDialog({ open: false, user: null, loading: false, forceDialogOpen: false });
      fetchData();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : "Error deleting user", "error");
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  }, [token, deleteDialog.user, fetchData, showSnackbar]);

  const handleForceDeleteCancel = useCallback(() => {
    setDeleteDialog((prev) => ({ ...prev, forceDialogOpen: false }));
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return {
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
    handleForceDeleteConfirm,
    handleForceDeleteCancel,

    handleSnackbarClose,
    refetch: fetchData,
  };
}

export default useUsersManagement;
