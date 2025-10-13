import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  Typography,
} from "@mui/material";
import CustomersTable from "./customersManagement/CustomersTable";
import { useAuthStore } from "../../stores/authStore";
import {
  apiService,
  type Customer,
  type Application,
  type CreateCustomerData,
} from "../../services/api";
import DeleteConfirmDialog from "../common/DeleteConfirmDialog";
import MyTextField from "../common/MyTextField";
import MySelect from "../common/MySelect";
import AdminGridHeader from "../common/AdminGridHeader";

const CustomersManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    applicationIds: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    customer: null as Customer | null,
    loading: false,
  });

  const fetchData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [customersData, applicationsData] = await Promise.all([
        apiService.getCustomers(token),
        apiService.getApplications(token),
      ]);
      setCustomers(customersData);
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

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        address: customer.address || "",
        description: customer.description || "",
        applicationIds:
          customer.applications?.map((ca) => ca.applicationId) || [],
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        description: "",
        applicationIds: [],
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleSubmit = async () => {
    if (!token) return;

    try {
      if (editingCustomer) {
        await apiService.updateCustomer(token, editingCustomer.id, formData);
        showSnackbar("Customer updated successfully", "success");
      } else {
        await apiService.createCustomer(token, formData);
        showSnackbar("Customer created successfully", "success");
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error saving customer",
        "error"
      );
    }
  };

  const handleDeleteClick = (customer: Customer) => {
    setDeleteDialog({
      open: true,
      customer,
      loading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteDialog.customer) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));

    try {
      await apiService.deleteCustomer(token, deleteDialog.customer.id);
      showSnackbar("Customer deleted successfully", "success");
      setDeleteDialog({ open: false, customer: null, loading: false });
      fetchData();
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "Error deleting customer",
        "error"
      );
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, customer: null, loading: false });
  };

  return (
    <Box>
      <AdminGridHeader
        title="Customers Management"
        onAdd={handleOpenDialog}
        addLabel="Add Customer"
      />
      
      <CustomersTable
        customers={customers}
        loading={loading}
        onEdit={(customer) => handleOpenDialog(customer)}
        onDelete={(customer) => handleDeleteClick(customer)}
      />

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCustomer ? "Edit Customer" : "Create New Customer"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <MyTextField
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              fullWidth
            />
            <MyTextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              fullWidth
            />
            <MyTextField
              label="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              fullWidth
            />
            <MyTextField
              label="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              multiline
              rows={2}
              fullWidth
            />
            <MyTextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="applications-label">Applications</InputLabel>
              <MySelect
                labelId="applications-label"
                label="Applications"
                multiple
                value={formData.applicationIds || []}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    applicationIds: e.target.value as string[],
                  })
                }
                onClose={() => {
                  // Optional: Add any logic when dropdown closes
                }}
                inputProps={{
                  autoComplete: "off",
                  autoCorrect: "off",
                  autoCapitalize: "off",
                  spellCheck: false,
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                  autoFocus: false,
                  disableAutoFocus: true,
                  disableEnforceFocus: true,
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const app = applications.find((a) => a.id === value);
                      return (
                        <Chip
                          key={value}
                          label={app?.name}
                          size="small"
                          onDelete={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const newIds =
                              formData.applicationIds?.filter(
                                (id) => id !== value
                              ) || [];
                            setFormData({
                              ...formData,
                              applicationIds: newIds,
                            });
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {applications.map((app) => (
                  <MenuItem key={app.id} value={app.id}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Typography variant="body2">{app.name}</Typography>
                      {formData.applicationIds?.includes(app.id) && (
                        <Box sx={{ ml: "auto", color: "primary.main" }}>✓</Box>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </MySelect>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.email}
          >
            {editingCustomer ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deleteDialog.customer?.name}
        itemType="customer"
        loading={deleteDialog.loading}
        warningMessage={
          deleteDialog.customer?._count?.tickets &&
          deleteDialog.customer._count.tickets > 0
            ? `This customer has ${deleteDialog.customer._count.tickets} associated ticket(s). Please reassign or delete them first.`
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

export default CustomersManagement;
