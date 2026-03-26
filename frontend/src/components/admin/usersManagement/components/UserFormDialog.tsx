import React, { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
} from "@mui/material";
import { useAuthStore } from "../../../../stores/authStore";
import { tenantsApi, type Tenant } from "../../../../services/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserFormDialogProps } from "../types/types";
import { userFormSchema } from "../schemas/userSchema";
import MySelect from "../../../common/MySelect";
import { Role } from "../../../../types/roles";
import type { UserRole } from "../../../../types/roles";

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  editing = false,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === Role.SUPER_ADMIN;

  const [tenants, setTenants] = React.useState<Tenant[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(userFormSchema),
    mode: "onChange",
    defaultValues:
      initialValues ||
      ({
        name: "",
        email: "",
        password: "",
        role: Role.EMPLOYEE,
        tenantSlug: "",
        phone: "",
        whatsappNotifications: false,
      } as const),
  });

  useEffect(() => {
    if (!open) return;

    reset(
      initialValues || {
        name: "",
        email: "",
        password: "",
        role: Role.EMPLOYEE as UserRole,
        tenantSlug: "",
        phone: "",
        whatsappNotifications: false,
      }
    );

    // Focus first field after dialog opens
    setTimeout(() => {
      const firstInput = document.querySelector(
        'input[name="name"]'
      ) as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 100);
  }, [open, initialValues, reset]);

  useEffect(() => {
    if (!open) return;
    if (!isSuperAdmin) return;

    let mounted = true;
    tenantsApi
      .list()
      .then((rows) => {
        if (!mounted) return;
        setTenants(rows);
      })
      .catch((e) => {
        console.error("Failed to load tenants", e);
        setTenants([]);
      });

    return () => {
      mounted = false;
    };
  }, [open, isSuperAdmin]);

  const submit = handleSubmit(onSubmit);
  const roleValue = watch("role");
  const tenantSlugValue = watch("tenantSlug");

  // Only super admin can create tenant admins.
  const canCreateTenantAdmin = isSuperAdmin && !editing;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? "Edit User" : "Create New User"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Name"
            {...register("name")}
            required
            fullWidth
            autoComplete="off"
            autoFocus
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label="Email"
            type="email"
            {...register("email")}
            required
            fullWidth
            autoComplete="off"
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label={editing ? "New Password (leave blank to keep current)" : "Password"}
            type="password"
            {...register("password")}
            fullWidth
            autoComplete="off"
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <FormControl fullWidth>
            <InputLabel id="role-label">Role</InputLabel>
            <MySelect
              labelId="role-label"
              label="Role"
              name="role"
              value={roleValue}
              onChange={(e) =>
                setValue("role", e.target.value as UserRole, {
                  shouldValidate: true,
                })
              }
            >
              {canCreateTenantAdmin && (
                <MenuItem value={Role.TENANT_ADMIN}>Tenant Admin</MenuItem>
              )}
              <MenuItem value={Role.EMPLOYEE}>Employee</MenuItem>
              <MenuItem value={Role.PROGRAMMER}>Programmer</MenuItem>
            </MySelect>
          </FormControl>

          {isSuperAdmin && (
            <FormControl fullWidth error={!!errors.tenantSlug}>
              <InputLabel id="tenant-label">Tenant</InputLabel>
              <MySelect
                labelId="tenant-label"
                label="Tenant"
                name="tenantSlug"
                value={tenantSlugValue || ""}
                onChange={(e) =>
                  setValue("tenantSlug", String(e.target.value), {
                    shouldValidate: true,
                  })
                }
              >
                <MenuItem value="">Select tenant</MenuItem>
                {tenants.map((t) => (
                  <MenuItem key={t.id} value={t.slug}>
                    {t.name} ({t.slug})
                  </MenuItem>
                ))}
              </MySelect>
              {errors.tenantSlug?.message && (
                <Box sx={{ color: "error.main", fontSize: 12, mt: 0.5 }}>
                  {String(errors.tenantSlug.message)}
                </Box>
              )}
            </FormControl>
          )}

          <TextField
            label="Phone Number"
            {...register("phone")}
            fullWidth
            autoComplete="off"
            error={!!errors.phone}
            helperText={
              errors.phone?.message || "Include country code (e.g., +1234567890)"
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={submit}
          variant="contained"
          disabled={!isValid || (!editing && !(watch("password") || "").toString().trim())}
        >
          {editing ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserFormDialog;
