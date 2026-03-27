import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ticketsApi } from '../../services/api';
import type { Ticket } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';

interface EditDueDateDialogProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
}

const EditDueDateDialog: React.FC<EditDueDateDialogProps> = ({ open, onClose, ticket }) => {
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDate(ticket.dueDate ? new Date(ticket.dueDate) : null);
  }, [open, ticket.dueDate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await ticketsApi.updateTicket(ticket.id, {
        dueDate: date ? date.toISOString() : null,
      } as any);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      onClose();
    } catch (e) {
      console.error('Edit due date error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableScrollLock>
      <DialogTitle>Edit Due Date</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {ticket.title}
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Due Date"
            value={date}
            onChange={setDate}
            format="dd/MM/yyyy"
            slotProps={{
              textField: { fullWidth: true, size: 'small' },
              actionBar: { actions: ['clear', 'today'] },
            }}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDueDateDialog;
