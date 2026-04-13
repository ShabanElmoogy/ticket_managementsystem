import { useState, useEffect } from 'react';
import type { EscalationConfig, AlertState } from '../types/types';
import { adminSettingsApi } from '../api/adminSettingsApi';
import { schedulerSchema } from '../schemas/adminSettingsSchemas';

export function useSchedulerSettings() {
  const [intervalMinutes, setIntervalMinutes] = useState<number | ''>('');
  const [scope, setScope]     = useState<EscalationConfig['scope']>('tenant');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [running, setRunning] = useState(false);
  const [alert, setAlert]     = useState<AlertState | null>(null);

  const showAlert = (type: AlertState['type'], msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    adminSettingsApi.getEscalationSettings()
      .then((r) => {
        setIntervalMinutes(r.intervalMinutes);
        setScope(r.scope);
      })
      .catch(() => showAlert('error', 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const result = schedulerSchema.safeParse({ intervalMinutes: Number(intervalMinutes) });
    if (!result.success) {
      showAlert('error', result.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const r = await adminSettingsApi.saveEscalationSettings(Number(intervalMinutes));
      setIntervalMinutes(r.intervalMinutes);
      setScope(r.scope);
      showAlert('success', `Escalation interval updated to ${r.intervalMinutes} minute(s)`);
    } catch (e: unknown) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await adminSettingsApi.runEscalationNow();
      showAlert('success', 'Escalation triggered — check ticket priorities and notifications');
    } catch (e: unknown) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to trigger escalation');
    } finally {
      setRunning(false);
    }
  };

  return {
    intervalMinutes, setIntervalMinutes,
    scope,
    loading, saving, running,
    alert,
    handleSave, handleRunNow,
  };
}
