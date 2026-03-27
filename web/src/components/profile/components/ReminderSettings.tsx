import React from 'react';
import { Typography, FormControlLabel, Switch, TextField, Divider } from '@mui/material';
import type { ReminderSettings as ReminderSettingsType } from '../../../services/api';

interface ReminderSettingsProps {
  reminderSettings: ReminderSettingsType;
  onReminderChange: (field: keyof ReminderSettingsType, value: boolean | number) => void;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({
  reminderSettings,
  onReminderChange,
}) => {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Reminder Settings
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <FormControlLabel
        control={
          <Switch
            checked={reminderSettings.reminderEnabled}
            onChange={(e) => onReminderChange('reminderEnabled', e.target.checked)}
          />
        }
        label="Enable ticket reminders"
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Reminder interval (minutes)"
        type="number"
        value={reminderSettings.reminderInterval}
        onChange={(e) =>
          onReminderChange('reminderInterval', parseInt(e.target.value) || 60)
        }
        disabled={!reminderSettings.reminderEnabled}
        helperText="How often to check for delayed tickets"
        inputProps={{ min: 1, max: 1440 }}
      />
    </>
  );
};

export default ReminderSettings;