import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Tooltip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  GridActionsCellItem,
  type GridRowParams,
} from "@mui/x-data-grid";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as ViewIcon,
  VisibilityOff,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import {
  apiService,
  type User,
  type CreateUserData,
  type UpdateUserData,
  type UserStats,
} from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import AdminGridHeader from "../common/AdminGridHeader";

interface UserFormData {
  email: string;
  name: string;
  password: string;
  role: "ADMIN" | "EMPLOYEE";
  phone?: string;
  whatsappNotifications: boolean;
}

const UserManagement: React.FC = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    name: "",
    password: "",
    role: "EMPLOYEE",
    phone: "",
    whatsappNotifications: false,
  });

  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({});

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      if (token) {
        const usersData = await apiService.getUsers(token);
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      showSnackbar("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      if (token) {
        const statsData = await apiService.getUserStats(token);
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    }
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const validateForm = (): boolean => {
    const errors: Partial<UserFormData> = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!editingUser && !formData.password.trim()) {
      errors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (
      formData.phone &&
      formData.phone.trim() &&
      !/^\+?[\d\s\-\(\)]+$/.test(formData.phone.trim())
    ) {
      errors.phone = "Invalid phone number format";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !token) return;

    try {
      if (editingUser) {
        // Update user
        const updateData: UpdateUserData = {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          phone: formData.phone?.trim() || undefined,
          whatsappNotifications: formData.whatsappNotifications,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await apiService.updateUser(token, editingUser.id, updateData);
        showSnackbar("User updated successfully", "success");
      } else {
        // Create user
        const createData: CreateUserData = {
          email: formData.email,
          name: formData.name,
          password: formData.password,
          role: formData.role,
          phone: formData.phone?.trim() || undefined,
          whatsappNotifications: formData.whatsappNotifications,
        };

        await apiService.createUser(token, createData);
        showSnackbar("User created successfully", "success");
      }

      handleCloseDialog();
      loadUsers();
      loadStats();
    } catch (error: any) {
      console.error("Error saving user:", error);
      showSnackbar(error.message || "Failed to save user", "error");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: "",
      role: user.role,
      phone: user.phone || "",
      whatsappNotifications: user.whatsappNotifications || false,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete || !token) return;

    try {
      await apiService.deleteUser(token, userToDelete.id);
      showSnackbar("User deleted successfully", "success");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
      loadStats();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      showSnackbar(error.message || "Failed to delete user", "error");
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      email: "",
      name: "",
      password: "",
      role: "EMPLOYEE",
      phone: "",
      whatsappNotifications: false,
    });
    setFormErrors({});
    setShowPassword(false);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      name: "",
      password: "",
      role: "EMPLOYEE",
      phone: "",
      whatsappNotifications: false,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "role",
      headerName: "Role",
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={params.value === "ADMIN" ? <AdminIcon /> : <PersonIcon />}
          label={params.value}
          color={params.value === "ADMIN" ? "primary" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {params.value ? (
            <>
              <PhoneIcon fontSize="small" color="action" />
              {params.value}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "whatsappNotifications",
      headerName: "WhatsApp",
      width: 100,
      renderCell: (params) => (
        <Chip
          icon={<WhatsAppIcon />}
          label={params.value ? "ON" : "OFF"}
          color={params.value ? "success" : "default"}
          size="small"
          variant={params.value ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "assignedTickets",
      headerName: "Assigned",
      width: 100,
      renderCell: (params) => params.row._count?.assignedTickets || 0,
    },
    {
      field: "createdTickets",
      headerName: "Created",
      width: 100,
      renderCell: (params) => params.row._count?.createdTickets || 0,
    },
    {
      field: "comments",
      headerName: "Comments",
      width: 100,
      renderCell: (params) => params.row._count?.comments || 0,
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 120,
      renderCell: (params) => format(new Date(params.value), "MMM dd, yyyy"),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Edit User">
              <EditIcon />
            </Tooltip>
          }
          label="Edit"
          onClick={() => handleEdit(params.row as User)}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Delete User">
              <DeleteIcon />
            </Tooltip>
          }
          label="Delete"
          onClick={() => handleDelete(params.row as User)}
        />,
      ],
    },
  ];

  return (
    <Box>
      <AdminGridHeader
        title="Users Management"
        onAdd={handleAddUser}
        addLabel="Add User"
      />

      {/* Statistics Cards */}
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
                <Typography variant="h4">
                  {stats.byRole.EMPLOYEE || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Users Table */}
      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={!!formErrors.name}
              helperText={formErrors.name}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={!!formErrors.email}
              helperText={formErrors.email}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={
                editingUser
                  ? "New Password (leave blank to keep current)"
                  : "Password"
              }
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={!!formErrors.password}
              helperText={formErrors.password}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <ViewIcon />}
                  </IconButton>
                ),
              }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as "ADMIN" | "EMPLOYEE",
                  })
                }
              >
                <MenuItem value="EMPLOYEE">Employee</MenuItem>
                <MenuItem value="ADMIN">Administrator</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              error={!!formErrors.phone}
              helperText={
                formErrors.phone || "Include country code (e.g., +1234567890)"
              }
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <PhoneIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.whatsappNotifications}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsappNotifications: e.target.checked,
                    })
                  }
                  color="success"
                />
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WhatsAppIcon color="success" />
                  Enable WhatsApp Notifications
                </Box>
              }
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{userToDelete?.name}"? This
            action cannot be undone.
          </Typography>
          {userToDelete?._count &&
            (userToDelete._count.assignedTickets > 0 ||
              userToDelete._count.createdTickets > 0 ||
              userToDelete._count.comments > 0) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This user has associated data (tickets or comments). Deletion
                may fail if there are dependencies.
              </Alert>
            )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
