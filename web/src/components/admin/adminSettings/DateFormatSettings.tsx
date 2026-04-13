import React, { useEffect, useState } from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Alert, CircularProgress, Paper, Chip,
} from '@mui/material';
import { format } from 'date-fns';
import { api } from '../../../services/api/base';
import { useTenantStore, DATE_FORMATS, type DateFormatValue } from '../../../stores/tenantStore';

const PREVIEW_DATE = new Date(2025, 11, 31); // 31 Dec 2025

const DateFormatSettings: React.FC = () => {
  const { dateFormat, setDateFormat } = useTenantStore();
  const [selected, setSelected] = useState<DateFormatValue>(dateFormat);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    api.get<{ dateFormat: DateFormatValue }>('/reminders/date-format-settings')
      .then((res) => {
        // Only use the API value if it's a real persisted value (not the fallback default)
        // The store value wins if it was explicitly saved by the user this session
        const apiFormat = res.dateFormat;
        // Always sync store → selected; API value only wins if store is still at default
        if (dateFormat === 'dd/MM/yyyy') {
          setSelected(apiFormat);
          setDateFormat(apiFormat);
        } else {
          // User already saved a format this session — keep it
          setSelected(dateFormat);
        }
      })
      .catch(() => setSelected(dateFormat))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await api.put<{ dateFormat: DateFormatValue }>(
        '/reminders/date-format-settings', { dateFormat: selected }
      );
      // Use the value the server echoes back (or fall back to what we sent)
      const saved = res?.dateFormat ?? selected;
      setSelected(saved);
      setDateFormat(saved);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;

  return (
    <Box maxWidth={480}>
      <Typography variant="subtitle1" fontWeight={700} mb={0.5}>Date Format</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Choose how dates are displayed across the entire application for all users in your organisation.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>

        <FormControl fullWidth size="small">
          <InputLabel>Date Format</InputLabel>
          <Select
            value={selected}
            label="Date Format"
            onChange={(e) => setSelected(e.target.value as DateFormatValue)}
            MenuProps={{ disableScrollLock: true }}
          >
            {DATE_FORMATS.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" gap={2}>
                  <Typography variant="body2">{f.label}</Typography>
                  <Chip
                    label={format(PREVIEW_DATE, f.value)}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20, fontFamily: 'monospace' }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Date format saved successfully.</Alert>}

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving}
        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </Box>
  );
};

export default DateFormatSettings;
