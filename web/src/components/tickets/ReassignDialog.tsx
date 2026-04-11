import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, MenuItem, TextField, CircularProgress, Typography,
} from '@mui/material';
import { usersApi } from '../../services/api';
import { ticketsApi } from '../../services/api';
import type { Ticket, User } from '../../services/api';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface ReassignDialogProps {
  open: boolean;
  onClose: () => void;
  ticket: Ticket;
}

const ReassignDialog: React.FC<ReassignDialogProps> = ({ open, onClose, ticket }) => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: employees = [], isLoading: loading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.getEmployees(),
    staleTime: 300_000,
    enabled: open,
  });

  useEffect(() => {
    if (open) setSelectedId(ticket.assignedToId ?? '');
  }, [open, ticket.assignedToId]);

  const handleSave = async () => {
    if (!selectedId || selectedId === ticket.assignedToId) return;
    setSaving(true);
    try {
      await ticketsApi.reassignTicket(ticket.id, selectedId);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      onClose();
    } catch (e) {
      console.error('Reassign error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableScrollLock>
      <DialogTitle>Reassign Ticket</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {ticket.title}
        </Typography>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <TextField
            select
            fullWidth
            label="Assign To"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            size="small"
          >
            {employees.map((emp) => (
              <MenuItem key={emp.id} value={emp.id}>
                {emp.name}
                {emp.id === ticket.assignedToId ? ' (current)' : ''}
              </MenuItem>
            ))}
          </TextField>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !selectedId || selectedId === ticket.assignedToId}
        >
          {saving ? <CircularProgress size={18} /> : 'Reassign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReassignDialog;
