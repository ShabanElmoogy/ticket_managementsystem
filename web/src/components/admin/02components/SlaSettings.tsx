import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress, Paper, Chip,
} from '@mui/material';
import { Timer as TimerIcon } from '@mui/icons-material';
import { api } from '../../../services/api';

interface SlaConfig {
  slaUrgentHours: number;
  slaHighHours: number;
  slaMediumHours: number;
  slaLowHours: number;
}

const PRIORITIES = [
  { key: 'slaUrgentHours', label: '🔴 URGENT', color: '#ef4444' },
  { key: 'slaHighHours',   label: '🟠 HIGH',   color: '#f97316' },
  { key: 'slaMediumHours', label: '🟡 MEDIUM', color: '#f59e0b' },
  { key: 'slaLowHours',    label: '🟢 LOW',    color: '#10b981' },
] as const;

const PRESETS = [
  { label: '1h',  value: 1 },
  { label: '2h',  value: 2 },
  { label: '4h',  value: 4 },
  { label: '8h',  value: 8 },
  { label: '24h', value: 24 },
  { label: '48h', value: 48 },
  { label: '72h', value: 72 },
];

const SlaSettings: React.FC = () => {
  const [config, setConfig] = useState<SlaConfig>({ slaUrgentHours: 4, slaHighHours: 8, slaMediumHours: 24, slaLowHours: 72 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showAlert = (type: 'success' | 'error', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    api.get<SlaConfig>('/reminders/sla-settings')
      .then(setConfig)
      .catch(() => showAlert('error', 'Failed to load SLA settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.put<SlaConfig>('/reminders/sla-settings', config);
      setConfig(updated);
      showAlert('success', 'SLA settings saved successfully');
    } catch (e: any) {
      showAlert('error', e?.message ?? 'Failed to save SLA settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Paper sx={{ p: 3, maxWidth: 560 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <TimerIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>SLA Timer Settings</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Set the response time limit per priority. A live countdown appears on each ticket and turns red when breached.
      </Typography>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.msg}</Alert>}

      <Box display="flex" flexDirection="column" gap={3}>
        {PRIORITIES.map(({ key, label, color }) => (
          <Box key={key}>
            <Typography variant="caption" fontWeight={700} sx={{ color, mb: 0.5, display: 'block' }}>
              {label}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
              {PRESETS.map((p) => (
                <Chip
                  key={p.value}
                  label={p.label}
                  size="small"
                  onClick={() => setConfig((c) => ({ ...c, [key]: p.value }))}
                  color={config[key] === p.value ? 'primary' : 'default'}
                  variant={config[key] === p.value ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
            <TextField
              label="Hours"
              type="number"
              size="small"
              value={config[key]}
              onChange={(e) => setConfig((c) => ({ ...c, [key]: Math.max(1, parseInt(e.target.value) || 1) }))}
              inputProps={{ min: 1 }}
              sx={{ width: 120 }}
            />
          </Box>
        ))}
      </Box>

      <Box mt={3}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Save SLA Settings'}
        </Button>
      </Box>
    </Paper>
  );
};

export default SlaSettings;
