import { memo } from "react";
import { Box, Chip, Button } from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PriorityHigh as PriorityIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";
import type { User } from "../../../services/api";
import type { Dayjs } from 'dayjs';
import { formatDate } from '../../../shared/utils/dateUtils';
import { getPriorityColor } from "./utils";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface OptionsBarProps {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  priority: Priority;
  assignedTo: string;
  dueDate: Dayjs | null;
  estimatedHours: string;
  employees: User[];
}

const OptionsBar = memo(({ showAdvanced, onToggleAdvanced, priority, assignedTo, dueDate, estimatedHours, employees }: OptionsBarProps) => (
  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
    <Button
      startIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      onClick={onToggleAdvanced}
      size="small"
      sx={{ color: "text.secondary" }}
    >
      {showAdvanced ? "Hide Options" : "More Options"}
    </Button>

    <Box display="flex" gap={1} flexWrap="wrap">
      <Chip
        icon={<PriorityIcon />}
        label={priority}
        size="small"
        sx={{
          backgroundColor: `${getPriorityColor(priority)}20`,
          color: getPriorityColor(priority),
          fontWeight: 600,
        }}
      />
      {assignedTo && (
        <Chip
          icon={<AssignmentIcon />}
          label={employees.find((emp) => emp.id === assignedTo)?.name || "Assigned"}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
      {dueDate && (
        <Chip
          icon={<ScheduleIcon />}
          label={`Due: ${formatDate(dueDate.toISOString())}`}
          size="small"
          color="warning"
          variant="outlined"
        />
      )}
      {estimatedHours && (
        <Chip
          icon={<TimerIcon />}
          label={`${estimatedHours}h`}
          size="small"
          color="info"
          variant="outlined"
        />
      )}
    </Box>
  </Box>
));

OptionsBar.displayName = "OptionsBar";
export default OptionsBar;
