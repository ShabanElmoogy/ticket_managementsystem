import React from "react";
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
  MenuItem
} from "@mui/material";
import type { UserFormDialogProps } from "../types/types";
import useUserForm from "../hooks/useUserForm";
import MySelect from "../../../common/MySelect";

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  editing = false,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const { register, submit, errors, isValid, watch, setValue } = useUserForm({
    open,
    initialValues,
    editing,
    onSubmit,
  });

  const roleValue = watch("role");
 
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
              onChange={(e) => setValue("role", e.target.value as "ADMIN" | "EMPLOYEE", { shouldValidate: true })}
            >
              <MenuItem value="EMPLOYEE">Employee</MenuItem>
              <MenuItem value="ADMIN">Administrator</MenuItem>
            </MySelect>
          </FormControl>

          <TextField
            label="Phone Number"
            {...register("phone")}
            fullWidth
            autoComplete="off"
            error={!!errors.phone}
            helperText={errors.phone?.message || "Include country code (e.g., +1234567890)"}
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
