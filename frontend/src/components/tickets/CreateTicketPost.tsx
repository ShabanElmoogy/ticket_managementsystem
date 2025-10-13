import React, { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Avatar,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Collapse,
  Divider,
} from "@mui/material";
import {
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PriorityHigh as PriorityIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuthStore } from "../../stores/authStore";
import type {
  User,
  Customer,
  Application,
  CreateTicketData,
} from "../../services/api";
import MyTextField from "../common/MyTextField";

interface CreateTicketPostProps {
  onSubmit: (data: CreateTicketData) => void;
  employees: User[];
  customers?: Customer[];
  applications?: Application[];
}

const CreateTicketPost: React.FC<CreateTicketPostProps> = ({
  onSubmit,
  employees,
  customers = [],
  applications = [],
}) => {
  const { user } = useAuthStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("MEDIUM");
  const [assignedTo, setAssignedTo] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsPosting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedToId: assignedTo || undefined,
        customerId: customerId || undefined,
        applicationId: applicationId || undefined,
        dueDate: dueDate?.toISOString(),
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setAssignedTo("");
      setCustomerId("");
      setApplicationId("");
      setDueDate(null);
      setEstimatedHours("");
      setShowAdvanced(false);
    } finally {
      setIsPosting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "#10b981";
      case "MEDIUM":
        return "#f59e0b";
      case "HIGH":
        return "#ef4444";
      case "URGENT":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" gap={2} mb={2}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              backgroundColor: user?.role === "ADMIN" ? "#ef4444" : "#10b981",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {getInitials(user?.name || "U")}
          </Avatar>
          <Box flexGrow={1}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              What's the issue, {user?.name?.split(" ")[0]}?
            </Typography>
            <MyTextField
              fullWidth
              placeholder="Describe the problem or request..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rounded
            />
          </Box>
        </Box>

        <Collapse in={title.length > 0}>
          <Box sx={{ ml: 7, mb: 2 }}>
            <MyTextField
              fullWidth
              multiline
              rows={3}
              placeholder="Provide more details about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rounded
            />
          </Box>
        </Collapse>

        <Collapse in={title.length > 0}>
          <Box sx={{ ml: 7 }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Button
                startIcon={
                  showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />
                }
                onClick={() => setShowAdvanced(!showAdvanced)}
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
                    label={
                      employees.find((emp) => emp.id === assignedTo)?.name ||
                      "Assigned"
                    }
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {dueDate && (
                  <Chip
                    icon={<ScheduleIcon />}
                    label={`Due: ${dueDate.toLocaleDateString()}`}
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

            <Collapse in={showAdvanced}>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={priority}
                    label="Priority"
                    onChange={(e) => setPriority(e.target.value as any)}
                    sx={{ borderRadius: 2 }}
                    inputProps={{ autoComplete: "off" }}
                  >
                    <MenuItem value="LOW">🟢 Low</MenuItem>
                    <MenuItem value="MEDIUM">🟡 Medium</MenuItem>
                    <MenuItem value="HIGH">🟠 High</MenuItem>
                    <MenuItem value="URGENT">🔴 Urgent</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Assign To</InputLabel>
                  <Select
                    value={assignedTo}
                    label="Assign To"
                    onChange={(e) => setAssignedTo(e.target.value)}
                    sx={{ borderRadius: 2 }}
                    inputProps={{ autoComplete: "off" }}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar
                            sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                          >
                            {getInitials(employee.name)}
                          </Avatar>
                          {employee.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={customerId}
                    label="Customer"
                    onChange={(e) => setCustomerId(e.target.value)}
                    sx={{ borderRadius: 2 }}
                    inputProps={{ autoComplete: "off" }}
                  >
                    <MenuItem value="">None</MenuItem>
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Application</InputLabel>
                  <Select
                    value={applicationId}
                    label="Application"
                    onChange={(e) => setApplicationId(e.target.value)}
                    sx={{ borderRadius: 2 }}
                    inputProps={{ autoComplete: "off" }}
                  >
                    <MenuItem value="">None</MenuItem>
                    {applications.map((app) => (
                      <MenuItem key={app.id} value={app.id}>
                        {app.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Second row for Due Date and Estimated Hours */}
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Due Date"
                    value={dueDate}
                    onChange={(date) => setDueDate(date)}
                    slotProps={{ 
                      textField: { 
                        size: 'small',
                        sx: { 
                          minWidth: 160,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }
                      } 
                    }}
                  />
                </LocalizationProvider>

                <TextField
                  label="Estimated Hours"
                  type="number"
                  size="small"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  inputProps={{ min: 0, step: 0.5 }}
                  sx={{ 
                    minWidth: 140,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Box>
            </Collapse>

            <Divider sx={{ my: 2 }} />

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="caption" color="textSecondary">
                This will be visible to all team members
              </Typography>

              <Button
                variant="contained"
                endIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={!title.trim() || !description.trim() || isPosting}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)",
                  },
                  "&:disabled": {
                    background: "#e5e7eb",
                    color: "#9ca3af",
                  },
                }}
              >
                {isPosting ? "Posting..." : "Post Ticket"}
              </Button>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default CreateTicketPost;
