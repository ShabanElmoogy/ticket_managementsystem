import React, { useState, useEffect } from 'react';
import {
  Box, Button, Checkbox, IconButton, TextField,
  Typography, List, ListItem, ListItemIcon, ListItemText, CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import type { SolutionStep } from '../../../services/api/types';

interface Props {
  steps: SolutionStep[];
  canEdit: boolean;
  onSave: (steps: SolutionStep[]) => Promise<unknown>;
}

const SolutionChecklist: React.FC<Props> = ({ steps: initialSteps, canEdit, onSave }) => {
  const [steps, setSteps] = useState<SolutionStep[]>(initialSteps);
  const [newText, setNewText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSteps(initialSteps.map(s => ({ ...s, done: Boolean(s.done) })));
  }, [initialSteps]);

  const toggle = (order: number) => {
    setSteps(prev => prev.map(s => s.order === order ? { ...s, done: !s.done } : s));
  };

  const addStep = () => {
    if (!newText.trim()) return;
    setSteps(prev => [...prev, { order: prev.length, text: newText.trim(), done: false }]);
    setNewText('');
  };

  const removeStep = (order: number) => {
    setSteps(prev => prev.filter(s => s.order !== order).map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(steps); } finally { setSaving(false); }
  };

  const done = steps.filter(s => s.done).length;

  return (
    <Box sx={{ p: 2 }}>
      {steps.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {done}/{steps.length} completed
        </Typography>
      )}
      <List dense disablePadding>
        {steps.map(step => (
          <ListItem key={step.order} disableGutters sx={{ py: 0.25 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Checkbox
                size="small"
                checked={step.done}
                onChange={() => toggle(step.order)}
                disabled={!canEdit}
              />
            </ListItemIcon>
            <ListItemText
              primary={step.text}
              sx={{ '& .MuiListItemText-primary': { textDecoration: step.done ? 'line-through' : 'none', color: step.done ? 'text.disabled' : 'text.primary' } }}
            />
            {canEdit && (
              <IconButton size="small" onClick={() => removeStep(step.order)} sx={{ color: 'error.main' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </ListItem>
        ))}
      </List>

      {canEdit && (
        <Box display="flex" gap={1} sx={{ mt: 1 }}>
          <TextField
            size="small"
            placeholder="Add a step..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStep()}
            sx={{ flex: 1 }}
          />
          <IconButton size="small" onClick={addStep} color="primary"><AddIcon /></IconButton>
        </Box>
      )}

      {canEdit && steps.length > 0 && (
        <Button
          variant="contained"
          size="small"
          startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ mt: 2 }}
        >
          Save Steps
        </Button>
      )}

      {steps.length === 0 && (
        <Typography variant="body2" color="text.secondary">No solution steps added yet.</Typography>
      )}
    </Box>
  );
};

export default SolutionChecklist;
