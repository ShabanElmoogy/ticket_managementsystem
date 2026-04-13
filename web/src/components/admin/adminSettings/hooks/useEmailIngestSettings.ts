import { useState, useEffect } from 'react';
import type { EmailConfig } from '../types/types';
import { adminSettingsApi } from '../api/adminSettingsApi';

interface AlertState {
  type: 'success' | 'error' | 'info';
  msg: string;
}

export function useEmailIngestSettings() {
  const [config, setConfig] = useState<EmailConfig>({
    enabled: false, host: '', port: '993', secure: true,
    user: '', intervalMinutes: '5',
  });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [alert, setAlert]     = useState<AlertState | null>(null);

  const showAlert = (type: AlertState['type'], msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    adminSettingsApi.getEmailIngest()
      .then(setConfig)
      .catch(() => showAlert('error', 'Failed to load email settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const r = await adminSettingsApi.runEmailIngestNow();
      showAlert('success', r.message);
    } catch (e: unknown) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to trigger ingestion');
    } finally {
      setRunning(false);
    }
  };

  return { config, loading, running, alert, handleRunNow };
}
