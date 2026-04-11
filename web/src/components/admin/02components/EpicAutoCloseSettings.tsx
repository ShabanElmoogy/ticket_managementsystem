import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Switch, FormControlLabel,
  Alert, CircularProgress, Divider,
} from '@mui/material';
import { AccountTree as EpicsIcon } from '@mui/icons-material';
import { api } from '../../../services/api';

const EpicAutoCloseSettings: React.FC = () => {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    api.get<{ epicAutoClose: boolean }>('/reminders/epic-auto-close-settings')
      .then((r) => setEnabled(r.epicAutoClose))
      .catch(() => showAlert('error', 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    try {
      const r = await api.put<{ epicAutoClose: boolean }>('/reminders/epic-auto-close-settings', { epicAutoClose: value });
      setEnabled(r.epicAutoClose);
      showAlert('success', `Epic auto-close ${r.epicAutoClose ? 'enabled' : 'disabled'}`);
    } catch (e: any) {
      showAlert('error', e?.message ?? 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

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
