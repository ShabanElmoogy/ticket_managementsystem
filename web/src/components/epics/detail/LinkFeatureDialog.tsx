import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { epicsApi } from '../api/epics';
import { featuresApi } from '../../features/api/features';

interface Props {
  open: boolean;
  epicId: string;
  linkedIds: string[];
  onClose: () => void;
  onLinked: (suggestedStatus: 'ACTIVE' | null) => void;
}

const LinkFeatureDialog: React.FC<Props> = ({ open, epicId, linkedIds, onClose, onLinked }) => {
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: allFeatures = [] } = useQuery({
    queryKey: ['features'],
    queryFn: () => featuresApi.list(),
    enabled: open,
  });

  const available = allFeatures.filter((f) => !linkedIds.includes(f.id) && !f.epicId);

  const handleLink = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const result = await epicsApi.linkFeature(epicId, selectedId);
      onLinked(result.suggestedStatus);
      onClose();
      setSelectedId('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Link Feature Request</DialogTitle>
      <DialogContent>
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel>Feature Request</InputLabel>
          <Select value={selectedId} label="Feature Request" onChange={(e) => setSelectedId(e.target.value)}>
            <MenuItem value=""><em>Select a feature…</em></MenuItem>
            {available.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.title} {f.applicationName ? `· ${f.applicationName}` : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {available.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No unlinked feature requests available.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleLink} disabled={saving || !selectedId}>
          {saving ? 'Linking…' : 'Link Feature'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LinkFeatureDialog;
