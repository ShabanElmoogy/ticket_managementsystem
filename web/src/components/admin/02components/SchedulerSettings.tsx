import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  Paper, Divider, Chip,
} from '@mui/material';
import { Schedule as ScheduleIcon, PlayArrow as RunIcon } from '@mui/icons-material';
import { api } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';

const PRESETS = [
  { label: '1 min',  value: 1 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '6 hrs',  value: 360 },
  { label: '24 hrs', value: 1440 },
];

const SchedulerSettings: React.FC = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [intervalMinutes, setIntervalMinutes] = useState<number | ''>('');
  const [scope, setScope] = useState<'global' | 'tenant'>('tenant');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    api.get<{ intervalMinutes: number; scope: string }>('/reminders/escalation-settings')
      .then((r) => { setIntervalMinutes(r.intervalMinutes); setScope(r.scope as any); })
      .catch(() => showAlert('error', 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!intervalMinutes || Number(intervalMinutes) < 1) return;
    setSaving(true);
    try {
      const r = await api.put<{ intervalMinutes: number; scope: string }>('/reminders/escalation-settings', { intervalMinutes: Number(intervalMinutes) });
      setIntervalMinutes(r.intervalMinutes);
      setScope(r.scope as any);
      showAlert('success', `Escalation interval updated to ${r.intervalMinutes} minute(s)`);
    } catch (e: any) {
      showAlert('error', e?.message ?? 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await api.post('/reminders/escalate-now', {});
      showAlert('success', 'Escalation triggered — check ticket priorities and notifications');
    } catch (e: any) {
      showAlert('error', e?.message ?? 'Failed to trigger escalation');
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Paper sx={{ p: 3, maxWidth: 520 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <ScheduleIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>Priority Auto-Escalation</Typography>
        <Chip
          label={scope === 'global' ? 'Global (all tenants)' : 'This tenant only'}
          size="small"
          color={scope === 'global' ? 'warning' : 'info'}
          variant="outlined"
        />
      </Box>

      <Typography variant="body2" color="text.secondary" mb={3}>
        {scope === 'global'
          ? 'Sets the default check interval for all tenants. Each tenant can override this with their own setting.'
          : 'Controls how often overdue tickets in your tenant are escalated one priority level: LOW → MEDIUM → HIGH → URGENT.'}
      </Typography>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.msg}</Alert>}

      <Typography variant="caption" color="text.secondary" fontWeight={600}>QUICK PRESETS</Typography>
      <Box display="flex" gap={1} flexWrap="wrap" mt={0.5} mb={2}>
        {PRESETS.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            size="small"
            onClick={() => setIntervalMinutes(p.value)}
            color={intervalMinutes === p.value ? 'primary' : 'default'}
            variant={intervalMinutes === p.value ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      <Box display="flex" gap={2} alignItems="flex-start">
        <TextField
          label="Interval (minutes)"
          type="number"
          size="small"
          value={intervalMinutes}
          onChange={(e) => setIntervalMinutes(e.target.value === '' ? '' : Number(e.target.value))}
          slotProps={{ htmlInput: { min: 1 } }}
          sx={{ width: 180 }}
          helperText="Min: 1 minute"
        />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !intervalMinutes || Number(intervalMinutes) < 1}
          sx={{ mt: 0.5 }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
        </Button>
      </Box>

      {isSuperAdmin && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>MANUAL TRIGGER</Typography>
          <Box mt={1}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={running ? <CircularProgress size={16} /> : <RunIcon />}
              onClick={handleRunNow}
              disabled={running}
            >
              Run Escalation Now
            </Button>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              Immediately escalates all eligible overdue tickets across all tenants.
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SchedulerSettings;
