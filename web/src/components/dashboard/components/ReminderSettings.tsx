import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Box,
  Chip,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Timer as TimerIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../../stores/authStore';
import { profileApi } from '../../../services/api';
import type { ReminderSettings as ReminderSettingsType } from '../../../services/api';
import { Role } from '../../../types/roles';

const ReminderSettings: React.FC = () => {
  const { user, token } = useAuthStore();
  const [settings, setSettings] = useState<ReminderSettingsType>({ reminderEnabled: true, reminderInterval: 60 });
  const [tempSettings, setTempSettings] = useState<ReminderSettingsType>({ reminderEnabled: true, reminderInterval: 60 });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const presetIntervals = [
    { label: '5 min', value: 5 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '4 hours', value: 240 },
  ];

  useEffect(() => {
    if (!token || user?.role !== Role.EMPLOYEE) return;

    const loadSettings = async () => {
      try {
        const reminderSettings = await profileApi.getReminderSettings();
        setSettings(reminderSettings);
        setTempSettings(reminderSettings);
      } catch (error) {
        console.error('Error loading reminder settings:', error);
      }
    };

    loadSettings();
  }, [token, user]);

  const handleSave = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const updatedSettings = await profileApi.updateReminderSettings(tempSettings);
      setSettings(updatedSettings);
      window.dispatchEvent(new CustomEvent('reminderSettingsChanged', { detail: updatedSettings }));
      setExpanded(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(tempSettings);

  if (user?.role !== Role.EMPLOYEE) return null;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimerIcon color="primary" />
            <Typography variant="h6">Ticket Reminders</Typography>
            <Chip 
              label={settings.reminderEnabled ? 'ON' : 'OFF'} 
              color={settings.reminderEnabled ? 'success' : 'default'}
              size="small"
            />
          </Box>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            {message && (
              <Alert severity={message.type} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={tempSettings.reminderEnabled}
                  onChange={(e) => setTempSettings({ ...tempSettings, reminderEnabled: e.target.checked })}
                />
              }
              label="Enable ticket reminders"
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Reminder Interval
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {presetIntervals.map((preset) => (
                <Chip
                  key={preset.value}
                  label={preset.label}
                  variant={tempSettings.reminderInterval === preset.value ? 'filled' : 'outlined'}
                  color={tempSettings.reminderInterval === preset.value ? 'primary' : 'default'}
                  onClick={() => setTempSettings({ ...tempSettings, reminderInterval: preset.value })}
                  disabled={!tempSettings.reminderEnabled}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>

            <TextField
              fullWidth
              label="Custom interval (minutes)"
              type="number"
              value={tempSettings.reminderInterval}
              onChange={(e) => setTempSettings({ ...tempSettings, reminderInterval: parseInt(e.target.value) || 60 })}
              disabled={!tempSettings.reminderEnabled}
              helperText="How often to check for delayed tickets (1-1440 minutes)"
              slotProps={{ htmlInput: { min: 1, max: 1440 } }}
              sx={{ mb: 2 }}
            />

            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Reminders will show tickets that are overdue or haven't been updated within the specified interval.
            </Typography>

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!hasChanges || loading}
              loading={loading}
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default ReminderSettings;