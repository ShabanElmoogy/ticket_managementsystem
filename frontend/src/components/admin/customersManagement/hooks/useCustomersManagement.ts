import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../../../../stores/authStore";
import { customersApi, applicationsApi, type Customer, type Application, type CreateCustomerData } from "../../../../services/api";

export type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

export type DeleteDialogState = {
  open: boolean;
  customer: Customer | null;
  loading: boolean;
};

export interface CustomersControllerReturn {
  customers: Customer[];
  applications: Application[];
  loading: boolean;

  dialogOpen: boolean;
  editingCustomer: Customer | null;
  formData: CreateCustomerData;

  snackbar: SnackbarState;
  deleteDialog: DeleteDialogState;

  handleOpenDialog: (customer?: Customer) => void;
  handleCloseDialog: () => void;
  handleSubmit: (values: CreateCustomerData) => Promise<void>;

  handleDeleteClick: (customer: Customer) => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;

  handleSnackbarClose: () => void;
  refetch: () => Promise<void>;
}

const DEFAULT_FORM_VALUES: CreateCustomerData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  description: "",
  applicationIds: [],
};

export function useCustomersManagement(): CustomersControllerReturn {
  const { token } = useAuthStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateCustomerData>(DEFAULT_FORM_VALUES);

  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ open: false, customer: null, loading: false });

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [customersData, applicationsData] = await Promise.all([
        customersApi.getCustomers(),
        applicationsApi.getApplications(),
      ]);
      setCustomers(customersData);
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

  const handleOpenDialog = useCallback((customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        address: customer.address || "",
        description: customer.description || "",
        applicationIds: customer.applications?.map((ca) => ca.applicationId) || [],
      });
    } else {
      setEditingCustomer(null);
      setFormData(DEFAULT_FORM_VALUES);
    }
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingCustomer(null);
  }, []);

  const handleSubmit = useCallback(async (values: CreateCustomerData) => {
    if (!token) return;
    try {
      if (editingCustomer) {
        await customersApi.updateCustomer(editingCustomer.id, values);
        showSnackbar("Customer updated successfully", "success");
      } else {
        await customersApi.createCustomer(values);
        showSnackbar("Customer created successfully", "success");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : "Error saving customer", "error");
    }
  }, [token, editingCustomer, handleCloseDialog, fetchData, showSnackbar]);

  const handleDeleteClick = useCallback((customer: Customer) => {
    setDeleteDialog({ open: true, customer, loading: false });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!token || !deleteDialog.customer) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      await customersApi.deleteCustomer(deleteDialog.customer.id);
      showSnackbar("Customer deleted successfully", "success");
      setDeleteDialog({ open: false, customer: null, loading: false });
      fetchData();
    } catch (error) {
      showSnackbar(error instanceof Error ? error.message : "Error deleting customer", "error");
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  }, [token, deleteDialog.customer, fetchData, showSnackbar]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ open: false, customer: null, loading: false });
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    customers,
    applications,
    loading,

    dialogOpen,
    editingCustomer,
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

export default useCustomersManagement;
