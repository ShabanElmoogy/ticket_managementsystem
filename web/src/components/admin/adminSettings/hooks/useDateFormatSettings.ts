import { useState, useEffect } from 'react';
import { useTenantStore, type DateFormatValue } from '../../../../stores/tenantStore';
import { adminSettingsApi } from '../api/adminSettingsApi';

export function useDateFormatSettings() {
  const { dateFormat, setDateFormat } = useTenantStore();
  const [selected, setSelected] = useState<DateFormatValue>(dateFormat);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    adminSettingsApi.getDateFormat()
      .then((res) => {
        const apiFormat = res.dateFormat;
        // Store value wins if user already saved a format this session
        if (dateFormat === 'dd/MM/yyyy') {
          setSelected(apiFormat);
          setDateFormat(apiFormat);
        } else {
          setSelected(dateFormat);
        }
      })
      .catch(() => setSelected(dateFormat))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await adminSettingsApi.saveDateFormat(selected);
      const saved = res?.dateFormat ?? selected;
      setSelected(saved);
      setDateFormat(saved);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return { selected, setSelected, saving, loading, success, error, handleSave };
}
