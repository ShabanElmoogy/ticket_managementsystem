import React from 'react';
import {
  Box, Typography, Alert, CircularProgress, Paper, Chip,
} from '@mui/material';
import { AppButton } from '../../../shared/components';
import { AppSelect } from '../../../shared/components/inputs/AppSelect';
import { format } from 'date-fns';
import { DATE_FORMATS } from '../../../stores/tenantStore';
import type { DateFormatValue } from '../../../stores/tenantStore';
import { useDateFormatSettings } from './hooks/useDateFormatSettings';

const PREVIEW_DATE = new Date(2025, 11, 31); // 31 Dec 2025

const options = DATE_FORMATS.map((f) => ({
  value: f.value,
  label: `${f.label}  →  ${format(PREVIEW_DATE, f.value)}`,
}));

const DateFormatSettings: React.FC = () => {
  const {
    selected, setSelected,
    saving, loading,
    success, error,
    handleSave,
  } = useDateFormatSettings();

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;

  return (
    <Box maxWidth={480}>
      <Typography variant="subtitle1" fontWeight={700} mb={0.5}>Date Format</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Choose how dates are displayed across the entire application for all users in your organisation.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
        <AppSelect
          label="Date Format"
          value={selected}
          onChange={(v) => setSelected(v as DateFormatValue)}
          options={options}
          size="small"
          fullWidth
        />

        <Box mt={2} display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary">Preview:</Typography>
          <Chip
            label={format(PREVIEW_DATE, selected)}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontFamily: 'monospace', fontWeight: 700 }}
          />
        </Box>
      </Paper>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => {}}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Date format saved successfully.</Alert>}

      <AppButton
        variant="contained"
        loading={saving}
        loadingText="Saving…"
        onClick={handleSave}
      >
        Save
      </AppButton>
    </Box>
  );
};

export default DateFormatSettings;
