import { useState, useEffect } from 'react';
import type { SlaConfig, AlertState } from '../types/types';
import { adminSettingsApi } from '../api/adminSettingsApi';
import { slaSchema } from '../schemas/adminSettingsSchemas';

const DEFAULT_CONFIG: SlaConfig = {
  slaUrgentHours: 4,
  slaHighHours: 8,
  slaMediumHours: 24,
  slaLowHours: 72,
};

export function useSlaSettings() {
  const [config, setConfig] = useState<SlaConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [alert, setAlert]     = useState<AlertState | null>(null);

  const showAlert = (type: AlertState['type'], msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    adminSettingsApi.getSlaSettings()
      .then(setConfig)
      .catch(() => showAlert('error', 'Failed to load SLA settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const result = slaSchema.safeParse(config);
    if (!result.success) {
      showAlert('error', result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const updated = await adminSettingsApi.saveSlaSettings(config);
      setConfig(updated);
      showAlert('success', 'SLA settings saved successfully');
    } catch (e: unknown) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to save SLA settings');
    } finally {
      setSaving(false);
    }
  };

  return { config, setConfig, loading, saving, alert, handleSave };
}
