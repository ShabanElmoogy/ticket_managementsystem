import React from 'react';
import {
  Box, Typography, Alert,
  Paper, Divider, Chip,
  CircularProgress,
} from '@mui/material';
import { AppButton, AppTextField } from '../../../shared/components';
import { Schedule as ScheduleIcon, PlayArrow as RunIcon } from '@mui/icons-material';
import { useAuthStore } from '../../../stores/authStore';
import { useSchedulerSettings } from './hooks/useSchedulerSettings';

const PRESETS = [
  { label: '1 min', value: 1 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '6 hrs', value: 360 },
  { label: '24 hrs', value: 1440 },
];

const SchedulerSettings: React.FC = () => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const {
    intervalMinutes, setIntervalMinutes,
    scope,
    loading, saving, running,
    alert,
    handleSave, handleRunNow,
  } = useSchedulerSettings();

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
        <AppTextField
          fieldType="number"
          label="Interval (minutes)"
          size="small"
          value={intervalMinutes}
          onChange={(e) => setIntervalMinutes(e.target.value === '' ? '' : Number(e.target.value))}
          min={1}
          sx={{ width: 180 }}
          helperText="Min: 1 minute"
        />
        <AppButton
          variant="contained"
          loading={saving}
          loadingText="Saving…"
          onClick={handleSave}
          disabled={!intervalMinutes || Number(intervalMinutes) < 1}
          sx={{ mt: 0.5 }}
        >
          Save
        </AppButton>
      </Box>

      {isSuperAdmin && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>MANUAL TRIGGER</Typography>
          <Box mt={1}>
            <AppButton
              variant="outlined"
              color="warning"
              loading={running}
              loadingText="Running…"
              startIcon={<RunIcon />}
              onClick={handleRunNow}
            >
              Run Escalation Now
            </AppButton>
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
