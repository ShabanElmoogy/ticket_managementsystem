import { useState, useEffect } from 'react';
import { adminSettingsApi } from '../api/adminSettingsApi';

interface AlertState {
  type: 'success' | 'error';
  msg: string;
}

export function useEpicAutoCloseSettings() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [alert, setAlert]     = useState<AlertState | null>(null);

  const showAlert = (type: AlertState['type'], msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    adminSettingsApi.getEpicAutoClose()
      .then((r) => setEnabled(r.epicAutoClose))
      .catch(() => showAlert('error', 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    try {
      const r = await adminSettingsApi.saveEpicAutoClose(value);
      setEnabled(r.epicAutoClose);
      showAlert('success', `Epic auto-close ${r.epicAutoClose ? 'enabled' : 'disabled'}`);
    } catch (e: unknown) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  return { enabled, loading, saving, alert, handleToggle };
}
