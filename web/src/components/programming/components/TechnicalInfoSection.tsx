import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, CircularProgress, Typography } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import type { ProgrammingDetails } from '../../../services/api/types';

interface Props {
  details: ProgrammingDetails | null;
  canEdit: boolean;
  onSave: (patch: Partial<ProgrammingDetails>) => Promise<unknown>;
  loading: boolean;
}

const TechnicalInfoSection: React.FC<Props> = ({ details, canEdit, onSave, loading }) => {
  const [form, setForm] = useState({
    technicalDescription: '',
    rootCause: '',
    stepsToReproduce: '',
    estimatedHours: '',
    actualHours: '',
  });

  useEffect(() => {
    if (details) {
      setForm({
        technicalDescription: details.technicalDescription || '',
        rootCause: details.rootCause || '',
        stepsToReproduce: details.stepsToReproduce || '',
        estimatedHours: details.estimatedHours?.toString() || '',
        actualHours: details.actualHours?.toString() || '',
      });
    }
  }, [details]);

  const handleSave = () => {
    onSave({
      technicalDescription: form.technicalDescription || undefined,
      rootCause: form.rootCause || undefined,
      stepsToReproduce: form.stepsToReproduce || undefined,
      estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
      actualHours: form.actualHours ? parseFloat(form.actualHours) : undefined,
    });
  };

  const field = (label: string, key: keyof typeof form, rows = 3) => (
    <TextField
      fullWidth
      multiline={rows > 1}
      rows={rows > 1 ? rows : undefined}
      label={label}
      value={form[key]}
      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
      disabled={!canEdit}
      size="small"
      sx={{ mb: 2 }}
    />
  );

  return (
    <Box sx={{ p: 2 }}>
      {field('Technical Description', 'technicalDescription')}
      {field('Root Cause Analysis', 'rootCause')}
      {field('Steps to Reproduce', 'stepsToReproduce')}
      <Box display="flex" gap={2}>
        <TextField
          label="Estimated Hours"
          type="number"
          value={form.estimatedHours}
          onChange={e => setForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
          disabled={!canEdit}
          size="small"
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
        />
        <TextField
          label="Actual Hours Spent"
          type="number"
          value={form.actualHours}
          onChange={e => setForm(prev => ({ ...prev, actualHours: e.target.value }))}
          disabled={!canEdit}
          size="small"
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
        />
      </Box>
      {canEdit && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={loading ? <CircularProgress size={14} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            Save
          </Button>
        </Box>
      )}
      {!canEdit && !details && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No technical details added yet.
        </Typography>
      )}
    </Box>
  );
};

export default TechnicalInfoSection;
