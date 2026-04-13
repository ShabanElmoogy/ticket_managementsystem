import React, { useEffect, useState } from "react";
import { DialogContent, DialogActions, Button, Box, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { customersApi, applicationsApi, type User, type CreateTicketData, type Customer, type Application } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import TitleField from "./createTicketForm/TitleField";
import DescriptionField from "./createTicketForm/DescriptionField";
import PrioritySelect from "./createTicketForm/PrioritySelect";
import AssignSelect from "./createTicketForm/AssignSelect";
import TemplatePickerButton from "./TemplatePickerButton";
import type { TicketTemplate } from "../../services/api/types";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { type Dayjs } from "dayjs";
import { getPickerDateFormat } from "../../stores/tenantStore";

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
  const { token } = useAuthStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("MEDIUM");
  const [assignedTo, setAssignedTo] = useState("");

  // New fields
  const [customerId, setCustomerId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [estimatedHours, setEstimatedHours] = useState<number | "">("");

  // Options
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setAssignedTo("");
    setCustomerId("");
    setApplicationId("");
    setDueDate(null);
    setEstimatedHours("");
  };

  useEffect(() => {
    // Ensure a fresh form when dialog opens or closes
    if (open === true) {
      reset();
    }
  }, [open]);

  useEffect(() => {
    const loadOptions = async () => {
      if (!token || !open) return;
      try {
        const [customersRes, applicationsRes] = await Promise.all([
          customersApi.getCustomers(),
          applicationsApi.getApplications(),
        ]);
        setCustomers(customersRes);
        setApplications(applicationsRes);
      } catch {
        // ignore; selects will be empty
      }
    };
    loadOptions();
  }, [token, open]);

  const applyTemplate = (t: TicketTemplate) => {
    setTitle(t.name);
    if (t.description) setDescription(t.description);
    setPriority(t.priority);
    if (t.estimatedHours != null) setEstimatedHours(t.estimatedHours);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateTicketData = {
      title,
      description,
      priority,
      assignedToId: assignedTo || undefined,
      customerId: customerId || undefined,
      applicationId: applicationId || undefined,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      estimatedHours:
        estimatedHours === "" || Number.isNaN(Number(estimatedHours))
          ? undefined
          : Number(estimatedHours),
    };

    onSubmit(payload);
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
        <Box display="flex" justifyContent="flex-end" mb={1}>
          <TemplatePickerButton onSelect={applyTemplate} />
        </Box>
        <TitleField value={title} onChange={setTitle} />
        <DescriptionField value={description} onChange={setDescription} />
        <PrioritySelect value={priority} onChange={setPriority} />
        <AssignSelect
          value={assignedTo}
          employees={employees}
          onChange={setAssignedTo}
        />

        {/* Customer & Application selects */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Customer</InputLabel>
          <Select
            value={customerId}
            label="Customer"
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <MenuItem value="">No Customer</MenuItem>
            {customers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel>Application</InputLabel>
          <Select
            value={applicationId}
            label="Application"
            onChange={(e) => setApplicationId(e.target.value)}
          >
            <MenuItem value="">No Application</MenuItem>
            {applications.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Other details */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Due Date"
            value={dueDate}
            onChange={(val) => setDueDate(val as Dayjs | null)}
            format={getPickerDateFormat()}
            slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
          />
        </LocalizationProvider>
        <TextField
          fullWidth
          margin="normal"
          type="number"
          slotProps={{ htmlInput: { min: 0, step: 0.25 } }}
          label="Estimated Hours"
          value={estimatedHours}
          onChange={(e) => {
            const v = e.target.value;
            setEstimatedHours(v === "" ? "" : Number(v));
          }}
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
