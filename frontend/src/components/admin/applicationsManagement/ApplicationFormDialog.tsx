import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import type { ApplicationFormDialogProps } from "./types";
import useApplicationForm from "./useApplicationForm";

const ApplicationFormDialog: React.FC<ApplicationFormDialogProps> = ({
  open,
  editing = false,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const { register, submit, errors, isValid } = useApplicationForm({
    open,
    initialValues,
    onSubmit,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editing ? "Edit Application" : "Create New Application"}
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
            label="Description"
            {...register("description")}
            multiline
            rows={3}
            fullWidth
            autoComplete="off"
            error={!!errors.description}
            helperText={errors.description?.message}
          />
          <TextField
            label="Version"
            {...register("version")}
            fullWidth
            autoComplete="off"
            error={!!errors.version}
            helperText={errors.version?.message}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={submit}
          variant="contained"
          disabled={!isValid}
        >
          {editing ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationFormDialog;
