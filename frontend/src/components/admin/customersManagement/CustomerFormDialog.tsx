import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  InputLabel,
  MenuItem,
  FormControl,
  Chip,
  Typography,
} from "@mui/material";
import type { CustomerFormDialogProps } from "./types";
import useCustomerForm from "./useCustomerForm";
import MySelect from "../../common/MySelect";

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open,
  editing = false,
  initialValues,
  applications,
  onClose,
  onSubmit,
}) => {
  const { register, submit, errors, isValid, watch, setValue } = useCustomerForm({
    open,
    initialValues,
    onSubmit,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editing ? "Edit Customer" : "Create New Customer"}
      </DialogTitle>
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
            label="Phone"
            {...register("phone")}
            fullWidth
            autoComplete="off"
            error={!!errors.phone}
            helperText={errors.phone?.message}
          />
          <TextField
            label="Address"
            {...register("address")}
            fullWidth
            autoComplete="off"
            error={!!errors.address}
            helperText={errors.address?.message}
          />
          <TextField
            label="Description"
            {...register("description")}
            multiline
            rows={3}
            fullWidth
            autoComplete="off"
            error={!!errors.description}
            helperText={errors.description?.message}
          />

          <FormControl fullWidth>
            <InputLabel id="applications-label">Applications</InputLabel>
            <MySelect
              labelId="applications-label"
              label="Applications"
              multiple
              value={watch("applicationIds") || []}
              onChange={(e) => setValue("applicationIds", e.target.value as string[], { shouldValidate: true })}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {(selected as string[]).map((value) => {
                    const app = applications.find((a) => a.id === value);
                    return (
                      <Chip
                        key={value}
                        label={app?.name}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {applications.map((app) => (
                <MenuItem key={app.id} value={app.id}>
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <Typography variant="body2">{app.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </MySelect>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={submit} variant="contained" disabled={!isValid}>
          {editing ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerFormDialog;
