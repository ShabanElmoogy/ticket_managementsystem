import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Grid,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useKanbanStore } from '../../stores/kanbanStore';
import type { Priority } from '../../types/kanban';
import { ticketsApi, usersApi, customersApi, applicationsApi } from '../../services/api';

interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Application {
  id: string;
  name: string;
  version?: string;
}

const CreateTicketDialog: React.FC<CreateTicketDialogProps> = ({
  open,
  onClose,
  boardId
}) => {
  const { labels, fetchLabels, fetchBoard } = useKanbanStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    assignedToId: '',
    customerId: '',
    applicationId: '',
    dueDate: null as Date | null,
    estimatedHours: '',
    selectedLabels: [] as string[]
  });

  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchLabels();
      fetchUsers();
      fetchCustomers();
      fetchApplications();
    }
  }, [open, fetchLabels]);

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers();
      setUsers(response);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getCustomers();
      setCustomers(response);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await applicationsApi.getApplications();
      setApplications(response);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ticketData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assignedToId: formData.assignedToId || undefined,
        customerId: formData.customerId || undefined,
        applicationId: formData.applicationId || undefined,
        boardId,
        dueDate: formData.dueDate?.toISOString(),
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        labels: formData.selectedLabels
      };

      await ticketsApi.createTicket(ticketData);
      
      // Refresh the board to show the new ticket
      await fetchBoard(boardId);
      
      handleClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      assignedToId: '',
      customerId: '',
      applicationId: '',
      dueDate: null,
      estimatedHours: '',
      selectedLabels: []
    });
    setError(null);
    onClose();
  };

  const handleLabelToggle = (labelId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLabels: prev.selectedLabels.includes(labelId)
        ? prev.selectedLabels.filter(id => id !== labelId)
        : [...prev.selectedLabels, labelId]
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Create New Ticket</DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Title */}
            <Grid size={{xs:12}}>
              <TextField
                label="Title"
                fullWidth
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>

            {/* Description */}
            <Grid size={{xs:12}}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>

            {/* Priority and Assignee */}
            <Grid size={{xs:6}}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Priority }))}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:6}}>
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={formData.assignedToId}
                  label="Assignee"
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedToId: e.target.value }))}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Customer and Application */}
            <Grid size={{xs:6}}>
              <FormControl fullWidth>
                <InputLabel>Customer</InputLabel>
                <Select
                  value={formData.customerId}
                  label="Customer"
                  onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                >
                  <MenuItem value="">None</MenuItem>
                  {customers.map(customer => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:6}}>
              <FormControl fullWidth>
                <InputLabel>Application</InputLabel>
                <Select
                  value={formData.applicationId}
                  label="Application"
                  onChange={(e) => setFormData(prev => ({ ...prev, applicationId: e.target.value }))}
                >
                  <MenuItem value="">None</MenuItem>
                  {applications.map(app => (
                    <MenuItem key={app.id} value={app.id}>
                      {app.name} {app.version && `(${app.version})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Due Date and Estimated Hours */}
            <Grid size={{xs:6}}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>

            <Grid size={{xs:6}}>
              <TextField
                label="Estimated Hours"
                type="number"
                fullWidth
                value={formData.estimatedHours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>

            {/* Labels */}
            <Grid size={{xs:12}}>
              <Typography variant="subtitle2" gutterBottom>
                Labels
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {labels.map(label => (
                  <Chip
                    key={label.id}
                    label={label.name}
                    clickable
                    variant={formData.selectedLabels.includes(label.id) ? 'filled' : 'outlined'}
                    onClick={() => handleLabelToggle(label.id)}
                    sx={{
                      backgroundColor: formData.selectedLabels.includes(label.id)
                        ? label.color
                        : 'transparent',
                      color: formData.selectedLabels.includes(label.id)
                        ? 'white'
                        : label.color,
                      borderColor: label.color
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formData.title.trim()}
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateTicketDialog;