import React, { useRef, useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, TextField, Autocomplete,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../../admin/ticketsManagement/api/tickets';
import type { Ticket } from '../../../services/api/types';

interface Props {
  open: boolean;
  epicId: string;
  linkedTicketIds: string[];
  onClose: () => void;
  onLinked: () => void;
}

const LinkTicketDialog: React.FC<Props> = ({ open, epicId, linkedTicketIds, onClose, onLinked }) => {
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const { data: allTickets = [] } = useQuery({
    queryKey: ['tickets', 'all'],
    queryFn: () => ticketsApi.getTickets({ deleted: false }),
    enabled: open,
    staleTime: 30_000,
  });

  const available = allTickets.filter((t) => !linkedTicketIds.includes(t.id));

  const handleLink = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { epicsApi } = await import('../api/epics');
      await epicsApi.linkTicket(epicId, selected.id);
      onLinked();
      onClose();
      setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableScrollLock>
      <DialogTitle>Link Ticket to Epic</DialogTitle>
      <DialogContent>
        <Autocomplete
          sx={{ mt: 1 }}
          options={available}
          getOptionLabel={(t) => `#${t.id.slice(0, 8)} · ${t.title}`}
          value={selected}
          onChange={(_, v) => setSelected(v)}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={inputRef}
              label="Search tickets"
              size="small"
              placeholder="Type to search…"
            />
          )}
          noOptionsText="No unlinked tickets available"
        />
        {selected && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {selected.status} · {selected.priority}{selected.customer?.name ? ` · ${selected.customer.name}` : ''}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleLink} disabled={saving || !selected}>
          {saving ? 'Linking…' : 'Link Ticket'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LinkTicketDialog;
