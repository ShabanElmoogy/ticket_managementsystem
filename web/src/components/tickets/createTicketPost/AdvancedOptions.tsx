import { memo } from "react";
import Grid from "@mui/material/Grid";
import type { User, Customer, Application, Ticket } from "../../../services/api";
import PrioritySelect, { type Priority } from "./fields/PrioritySelect";
import AssignToSelect from "./fields/AssignToSelect";
import CustomerSelect from "./fields/CustomerSelect";
import ApplicationSelect from "./fields/ApplicationSelect";
import DueDatePicker from "./fields/DueDatePicker";
import EstimatedHoursInput from "./fields/EstimatedHoursInput";

export interface AdvancedOptionsProps {
  priority: Priority;
  onPriorityChange: (p: Priority) => void;
  assignedTo: string;
  onAssignedToChange: (id: string) => void;
  customerId: string;
  onCustomerChange: (id: string) => void;
  applicationId: string;
  onApplicationChange: (id: string) => void;
  dueDate: Date | null;
  onDueDateChange: (date: Date | null) => void;
  estimatedHours: string;
  onEstimatedHoursChange: (value: string) => void;
  employees: User[];
  customers: Customer[];
  applications: Application[];
  tickets?: Ticket[];
}

const AdvancedOptions = memo(
  ({
    priority,
    onPriorityChange,
    assignedTo,
    onAssignedToChange,
    customerId,
    onCustomerChange,
    applicationId,
    onApplicationChange,
    dueDate,
    onDueDateChange,
    estimatedHours,
    onEstimatedHoursChange,
    employees,
    customers,
    applications,
    tickets,
  }: AdvancedOptionsProps) => (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CustomerSelect
            value={customerId}
            onChange={onCustomerChange}
            customers={customers}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <ApplicationSelect
            value={applicationId}
            onChange={onApplicationChange}
            applications={applications}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AssignToSelect
            value={assignedTo}
            onChange={onAssignedToChange}
            employees={employees}
            tickets={tickets}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <DueDatePicker value={dueDate} onChange={onDueDateChange} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <PrioritySelect value={priority} onChange={onPriorityChange} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <EstimatedHoursInput
            value={estimatedHours}
            onChange={onEstimatedHoursChange}
          />
        </Grid>
      </Grid>
    </>
  )
);

AdvancedOptions.displayName = "AdvancedOptions";
export default AdvancedOptions;
