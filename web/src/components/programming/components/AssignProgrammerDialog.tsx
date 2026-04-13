import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Typography,
} from '@mui/material';
import { ticketsApi } from '../../../services/api';
import { programmingApi } from '../api/programming';

interface Programmer { id: string; name: string; email: string; }

interface Props {
  open: boolean;
  ticketId: string;
  onClose: () => void;
  onAssigned: () => void;
}

const AssignProgrammerDialog: React.FC<Props> = ({ open, ticketId, onClose, onAssigned }) => {
  const [programmers, setProgrammers] = useState<Programmer[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    ticketsApi.getProgrammers()
      .then(data => setProgrammers(data))
      .catch(() => setError('Failed to load programmers'))
      .finally(() => setLoading(false));
  }, [open]);

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await programmingApi.assignProgrammer(ticketId, selected);
      onAssigned();
      onClose();
    } catch {
      setError('Failed to assign programmer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableScrollLock>
      <DialogTitle>Assign Programmer</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Select Programmer</InputLabel>
            <Select
              value={selected}
              label="Select Programmer"
              onChange={e => setSelected(e.target.value)}
            >
              {programmers.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.name} ({p.email})</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {error && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{error}</Typography>}
        {!loading && programmers.length === 0 && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No programmers found in this tenant. Create a user with the Programmer role first.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={!selected || saving}
          startIcon={saving ? <CircularProgress size={14} /> : undefined}
        >
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignProgrammerDialog;
