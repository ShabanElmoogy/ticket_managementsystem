import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { adminSettingsApi } from '@/src/features/admin/settings/api/adminSettingsApi';
import SettingsCard, { AlertBanner } from '@/src/features/admin/settings/components/SettingsCard';
import { AppButton } from '@/src/shared/components';
import ChipSelector from '@/src/shared/components/forms/ChipSelector';
import { useTenantStore, DATE_FORMATS, type DateFormatValue } from '@/src/stores/tenantStore';

type AlertState = { type: 'success' | 'error' | 'info'; msg: string } | null;

const TO_DAYJS: Record<string, string> = {
  'dd/MM/yyyy':  'DD/MM/YYYY',
  'MM/dd/yyyy':  'MM/DD/YYYY',
  'yyyy-MM-dd':  'YYYY-MM-DD',
  'dd-MM-yyyy':  'DD-MM-YYYY',
  'MM-dd-yyyy':  'MM-DD-YYYY',
  'd MMM yyyy':  'D MMM YYYY',
  'MMM d, yyyy': 'MMM D, YYYY',
};

const PREVIEW_DATE = dayjs('2025-12-31');

const DateFormatPanel: React.FC = () => {
  const { dateFormat, setDateFormat } = useTenantStore();

  const [selected, setSelected] = useState<DateFormatValue>(dateFormat);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [alert,    setAlert]    = useState<AlertState>(null);

  const showAlert = (type: 'success' | 'error' | 'info', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  useEffect(() => {
    adminSettingsApi.getDateFormat()
      .then((res) => {
        const fmt = res.dateFormat as DateFormatValue;
        setSelected(fmt);
        setDateFormat(fmt);
      })
      .catch(() => setSelected(dateFormat))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminSettingsApi.saveDateFormat(selected);
      const saved = (res?.dateFormat ?? selected) as DateFormatValue;
      setSelected(saved);
      setDateFormat(saved);
      showAlert('success', 'Date format saved successfully');
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  // Build options from DATE_FORMATS — preview shows the formatted date
  const options = DATE_FORMATS.map((fmt) => ({
    value:   fmt.value,
    label:   fmt.value,
    description: fmt.preview,
    preview: PREVIEW_DATE.format(TO_DAYJS[fmt.value] ?? fmt.value),
  }));

  const content = (
    <>
      {alert && <AlertBanner {...alert} />}
      <ChipSelector
        options={options}
        value={selected}
        onChange={(v) => setSelected(v as DateFormatValue)}
      />
      <AppButton variant="primary" loading={saving} loadingText="Saving…" onPress={handleSave} fullWidth>
        Save Date Format
      </AppButton>
    </>
  );

  return (
    <SettingsCard
      icon="📅"
      title="Date Format"
      description="Choose how dates are displayed across the entire application for all users in your organisation."
      loading={loading}
      children={content}
    />
  );
};

export default DateFormatPanel;
