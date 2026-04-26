import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import dayjs from 'dayjs';
import { adminSettingsApi } from '@/src/features/admin/settings/api/adminSettingsApi';
import SettingsCard, { AlertBanner } from '@/src/features/admin/settings/components/SettingsCard';
import { AppButton } from '@/src/shared/components';
import { useThemeColors } from '@/src/constants/theme';
import { useTenantStore, DATE_FORMATS, type DateFormatValue } from '@/src/stores/tenantStore';
import { useUiStore } from '@/src/stores/uiStore';

type AlertState = { type: 'success' | 'error' | 'info'; msg: string } | null;

// date-fns tokens → dayjs tokens (server stores date-fns format)
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
  const c = useThemeColors();

  const [selected, setSelected] = useState<DateFormatValue>(dateFormat);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [alert,    setAlert]    = useState<AlertState>(null);

  const showAlert = (type: AlertState['type'], msg: string) => {
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

  return (
    <SettingsCard
      icon="📅" title="Date Format"
      description="Choose how dates are displayed across the entire application for all users in your organisation."
      loading={loading}
    >
      {alert && <AlertBanner {...alert} isDark={false} />}

      {/* Format options */}
      <View style={{ gap: 8, marginBottom: 16 }}>
        {DATE_FORMATS.map((fmt) => {
          const isActive = selected === fmt.value;
          return (
            <Pressable
              key={fmt.value}
              onPress={() => setSelected(fmt.value)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                padding: 12, borderRadius: 10,
                backgroundColor: isActive ? '#3b82f618' : c.surface.secondary,
                borderWidth: 2,
                borderColor: isActive ? '#3b82f6' : c.border.primary,
              }}
            >
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.text.primary }}>
                  {fmt.value}
                </Text>
                <Text style={{ fontSize: 11, color: c.text.muted, marginTop: 2 }}>
                  {fmt.preview}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  backgroundColor: isActive ? '#3b82f6' : c.surface.tertiary,
                  borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                }}>
                  <Text style={{
                    fontSize: 11, fontWeight: '700', fontFamily: 'monospace',
                    color: isActive ? '#fff' : c.text.secondary,
                  }}>
                    {PREVIEW_DATE.format(TO_DAYJS[fmt.value] ?? fmt.value)}
                  </Text>
                </View>
                {isActive && <Text style={{ color: '#3b82f6', fontSize: 16 }}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>

      <AppButton variant="contained" loading={saving} loadingText="Saving…" onPress={handleSave} fullWidth>
        Save Date Format
      </AppButton>
    </SettingsCard>
  );
};

export default DateFormatPanel;
