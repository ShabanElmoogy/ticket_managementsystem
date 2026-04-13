import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress,
  Paper, Switch, FormControlLabel, Divider, Chip,
} from '@mui/material';
import { Email as EmailIcon, PlayArrow as RunIcon } from '@mui/icons-material';
import { api } from '../../../services/api';

interface EmailConfig {
  enabled: boolean;
  host: string;
  port: string;
  secure: boolean;
  user: string;
  intervalMinutes: string;
}

const EmailIngestSettings: React.FC = () => {
  const [config, setConfig] = useState<EmailConfig>({
    enabled: false, host: '', port: '993', secure: true,
    user: '', intervalMinutes: '5',
  });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  const showAlert = (type: 'success' | 'error' | 'info', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    api.get<EmailConfig>('/email-ingest/settings')
      .then(setConfig)
      .catch(() => showAlert('error', 'Failed to load email settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const r = await api.post<{ message: string }>('/email-ingest/run-now', {});
      showAlert('success', r.message);
    } catch (e: any) {
      showAlert('error', e?.message ?? 'Failed to trigger ingestion');
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <CircularProgress size={24} />;

  return (
    <Paper sx={{ p: 3, maxWidth: 580 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <EmailIcon color="primary" />
        <Typography variant="h6" fontWeight={700}>Email-to-Ticket</Typography>
        <Chip
          label={config.enabled ? 'Enabled' : 'Disabled'}
          color={config.enabled ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
        <Chip label="Server-wide" size="small" color="warning" variant="outlined" />
      </Box>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Automatically create tickets from incoming emails via IMAP. Configure your mailbox credentials in the server <code>.env</code> file and restart the server to apply changes.
      </Typography>

      {alert && <Alert severity={alert.type} sx={{ mb: 2 }}>{alert.msg}</Alert>}

      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" alignItems="center" gap={2} p={2} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
          <FormControlLabel
            control={<Switch checked={config.enabled} disabled />}
            label={<Typography variant="body2" fontWeight={600}>Ingestion Active</Typography>}
          />
          <Typography variant="caption" color="text.secondary">
            Set <code>EMAIL_INGEST_ENABLED=true</code> in .env to enable
          </Typography>
        </Box>

        <TextField label="IMAP Host" value={config.host || '—'} size="small" fullWidth slotProps={{ input: { readOnly: true } }} helperText="EMAIL_INGEST_HOST" />
        <Box display="flex" gap={2}>
          <TextField label="Port" value={config.port} size="small" sx={{ width: 100 }} slotProps={{ input: { readOnly: true } }} helperText="EMAIL_INGEST_PORT" />
          <TextField label="Secure (TLS)" value={config.secure ? 'Yes' : 'No'} size="small" sx={{ width: 120 }} slotProps={{ input: { readOnly: true } }} helperText="EMAIL_INGEST_SECURE" />
          <TextField label="Poll Interval" value={`${config.intervalMinutes} min`} size="small" sx={{ flex: 1 }} slotProps={{ input: { readOnly: true } }} helperText="EMAIL_INGEST_INTERVAL_MINUTES" />
        </Box>
        <TextField label="Mailbox User" value={config.user || '—'} size="small" fullWidth slotProps={{ input: { readOnly: true } }} helperText="EMAIL_INGEST_USER" />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
          MANUAL TRIGGER
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={running ? <CircularProgress size={16} /> : <RunIcon />}
          onClick={handleRunNow}
          disabled={running || !config.enabled}
        >
          {running ? 'Running...' : 'Fetch Emails Now'}
        </Button>
        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
          Immediately checks the inbox for unseen emails and creates tickets.
          {!config.enabled && ' Enable ingestion first.'}
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
          HOW IT WORKS
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {[
            'Connects to your IMAP mailbox and fetches UNSEEN messages',
            'Subject → ticket title, body → ticket description',
            'Sender email is matched to an existing customer automatically',
            'Tenant is resolved from the Support Email set on each tenant (Tenants Management)',
            'Tickets are created under the matched tenant automatically',
            'Processed emails are marked as Seen to avoid duplicates',
            'Works with Gmail (App Password), Outlook, and any IMAP server',
          ].map((item) => (
            <Typography key={item} component="li" variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              {item}
            </Typography>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default EmailIngestSettings;
