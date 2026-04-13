import React from 'react';
import {
  Box, Typography, Paper, Switch, FormControlLabel,
  Alert, CircularProgress, Divider,
} from '@mui/material';
import { AccountTree as EpicsIcon } from '@mui/icons-material';
import { useEpicAutoCloseSettings } from './hooks/useEpicAutoCloseSettings';

const EpicAutoCloseSettings: React.FC = () => {
  const { enabled, loading, saving, alert, handleToggle } = useEpicAutoCloseSettings();

  if (loading) return <CircularProgress size={24} />;

  return (
    <Paper sx={{ p: 3, maxWidth: 520 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <EpicsIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>Epic Auto-Close</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        When all features in an epic are <strong>SHIPPED</strong> and all linked tickets are{' '}
        <strong>RESOLVED</strong> or <strong>CLOSED</strong>, automatically transition the epic to{' '}
        <strong>COMPLETED</strong> without showing a confirmation dialog.
      </Typography>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.msg}</Alert>}

      <Divider sx={{ mb: 2 }} />

      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={saving}
            color="success"
          />
        }
        label={
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {enabled ? 'Auto-close enabled' : 'Auto-close disabled'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {enabled
                ? 'Epics will be automatically completed when all conditions are met.'
                : 'A confirmation dialog will always be shown before closing an epic.'}
            </Typography>
          </Box>
        }
      />
    </Paper>
  );
};

export default EpicAutoCloseSettings;
