import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import { useKanbanStore } from '../../stores/kanbanStore';
import type { TaskStatus } from './types/types';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  columnId?: string;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  boardId,
  columnId
}) => {
  const { currentBoard, createTask, loading } = useKanbanStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: null as Dayjs | null,
    columnId: columnId || ''
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!formData.columnId) {
      setError('Column is required');
      return;
    }

    setError(null);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        boardId,
        columnId: formData.columnId,
        assigneeId: formData.assigneeId || undefined,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : undefined,
        status: 'TODO' as TaskStatus
      };

      await createTask(taskData);
      handleClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create task');
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      assigneeId: '',
      dueDate: null,
      columnId: columnId || ''
    });
    setError(null);
    onClose();
  };

  // Get available users for assignment (you might want to fetch this from a users store)
  const availableUsers: any[] = [
    // This should come from a users store or API call
    // For now, using mock data
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableScrollLock>
        <DialogTitle>Create New Task</DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs:12}}>
              <TextField
                label="Task Title"
                fullWidth
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>

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

            <Grid size={{xs:12, sm:6}}>
              <FormControl fullWidth required>
                <InputLabel>Column</InputLabel>
                <Select
                  value={formData.columnId}
                  label="Column"
                  onChange={(e) => setFormData(prev => ({ ...prev, columnId: e.target.value }))}
                >
                  {currentBoard?.columns?.map((column) => (
                    <MenuItem key={column.id} value={column.id}>
                      {column.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12, sm:6}}>
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select
                  value={formData.assigneeId}
                  label="Assignee"
                  onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {availableUsers.map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{xs:12, sm:6}}>
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={(val) => setFormData(prev => ({ ...prev, dueDate: val as Dayjs | null }))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formData.title.trim() || !formData.columnId}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateTaskDialog;