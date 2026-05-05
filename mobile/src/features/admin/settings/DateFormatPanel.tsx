import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { adminSettingsApi } from '@/src/features/admin/settings/api/adminSettingsApi';
import SettingsCard from '@/src/features/admin/settings/components/SettingsCard';
import SettingsPanelLayout from '@/src/features/admin/settings/components/SettingsPanelLayout';
import { AppButton } from '@/src/shared/components';
import ChipSelector from '@/src/shared/components/forms/ChipSelector';
import { useTenantStore, DATE_FORMATS, type DateFormatValue } from '@/src/stores/tenantStore';
import { useThemeColors } from '@/src/constants/theme';

const TO_DAYJS: Record<string, string> = {
  'dd/MM/yyyy': 'DD/MM/YYYY',
  'MM/dd/yyyy': 'MM/DD/YYYY',
  'yyyy-MM-dd': 'YYYY-MM-DD',
  'dd-MM-yyyy': 'DD-MM-YYYY',
  'MM-dd-yyyy': 'MM-DD-YYYY',
  'd MMM yyyy': 'D MMM YYYY',
  'MMM d, yyyy': 'MMM D, YYYY',
};

const PREVIEW_DATE = dayjs('2025-12-31');

const DateFormatPanel: React.FC = () => {
  const { dateFormat, setDateFormat } = useTenantStore();
  const c = useThemeColors();
  const { t } = useTranslation();

  const [selected, setSelected] = useState<DateFormatValue>(dateFormat);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminSettingsApi.getDateFormat()
      .then((res) => {
        const fmt = res.dateFormat as DateFormatValue;
        setSelected(fmt);
        setDateFormat(fmt);
      })
      .catch(() => Toast.show({ type: 'error', text1: t('settings.dateFormat.loadError') }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminSettingsApi.saveDateFormat(selected);
      const saved = (res?.dateFormat ?? selected) as DateFormatValue;
      setSelected(saved);
      setDateFormat(saved);
      Toast.show({ type: 'success', text1: t('settings.dateFormat.saveSuccess') });
    } catch (e) {
      Toast.show({ type: 'error', text1: e instanceof Error ? e.message : t('settings.dateFormat.saveError') });
    } finally { setSaving(false); }
  };

  const options = DATE_FORMATS.map((fmt) => ({
    value: fmt.value,
    label: fmt.value,
    description: fmt.preview,
    preview: PREVIEW_DATE.format(TO_DAYJS[fmt.value] ?? fmt.value),
  }));

  return (
    <SettingsPanelLayout
      footer={
        <AppButton
          variant="contained"
          size="large"
          fullWidth
          loading={saving}
          loadingText={t('common.saving')}
          onPress={handleSave}
          leftIcon={<Ionicons name="save" size={18} color={c.text.inverse} style={{ marginEnd: 6 }} />}
        >
          {t('settings.dateFormat.save')}
        </AppButton>
      }
    >
      <SettingsCard
        icon={<Ionicons name="calendar" size={20} color={c.tint} />}
        title={t('settings.dateFormat.title')}
        description={t('settings.dateFormat.description')}
        loading={loading}
      >
        <ChipSelector
          options={options}
          value={selected}
          onChange={(v) => setSelected(v as DateFormatValue)}
        />
      </SettingsCard>
    </SettingsPanelLayout>
  );
};

export default DateFormatPanel;
