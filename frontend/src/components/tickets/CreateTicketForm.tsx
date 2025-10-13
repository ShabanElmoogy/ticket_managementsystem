import React, { useEffect, useState } from "react";
import { DialogContent, DialogActions, Button, Box } from "@mui/material";
import type { User, CreateTicketData } from "../../services/api";
import TitleField from "./createTicketForm/TitleField";
import DescriptionField from "./createTicketForm/DescriptionField";
import PrioritySelect from "./createTicketForm/PrioritySelect";
import AssignSelect from "./createTicketForm/AssignSelect";

export interface CreateTicketFormProps {
  open?: boolean;
  employees: User[];
  onSubmit: (data: CreateTicketData) => void;
  onCancel: () => void;
}

const CreateTicketForm: React.FC<CreateTicketFormProps> = ({
  open,
  employees,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("MEDIUM");
  const [assignedTo, setAssignedTo] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setAssignedTo("");
  };

  useEffect(() => {
    // Ensure a fresh form when dialog opens or closes
    if (open === true) {
      reset();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      priority,
      assignedToId: assignedTo || undefined,
    });
    // Keep dialog open but reset fields (matches previous behavior)
    reset();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <DialogContent>
        <TitleField value={title} onChange={setTitle} />
        <DescriptionField value={description} onChange={setDescription} />
        <PrioritySelect value={priority} onChange={setPriority} />
        <AssignSelect
          value={assignedTo}
          employees={employees}
          onChange={setAssignedTo}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button type="submit" variant="contained">
          Create Ticket
        </Button>
      </DialogActions>
    </Box>
  );
};

export default CreateTicketForm;
