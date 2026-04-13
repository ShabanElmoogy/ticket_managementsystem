import React from 'react';
import {
  Box, Typography, Alert, Paper, Chip, useTheme, CircularProgress,
} from '@mui/material';
import { AppButton, AppTextField } from '../../../shared/components';
import { Timer as TimerIcon } from '@mui/icons-material';
import { useSlaSettings } from './hooks/useSlaSettings';
import type { SlaConfig } from './types/types';


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
  const theme = useTheme();
  const { config, setConfig, loading, saving, alert, handleSave } = useSlaSettings();

  const PRIORITIES: { key: keyof SlaConfig; label: string; color: string }[] = [
    { key: 'slaUrgentHours', label: '🔴 URGENT', color: theme.palette.error.main },
    { key: 'slaHighHours',   label: '🟠 HIGH',   color: theme.palette.warning.dark },
    { key: 'slaMediumHours', label: '🟡 MEDIUM', color: theme.palette.warning.main },
    { key: 'slaLowHours',    label: '🟢 LOW',    color: theme.palette.success.main },
  ];

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
            <AppTextField
              fieldType="number"
              label="Hours"
              size="small"
              value={config[key]}
              onChange={(e) => setConfig((c) => ({ ...c, [key]: Math.max(1, parseInt(e.target.value) || 1) }))}
              min={1}
              sx={{ width: 120 }}
            />
          </Box>
        ))}
      </Box>

      <Box mt={3}>
        <AppButton
          variant="contained"
          loading={saving}
          loadingText="Saving…"
          onClick={handleSave}
        >
          Save SLA Settings
        </AppButton>
      </Box>
    </Paper>
  );
};

export default SlaSettings;
