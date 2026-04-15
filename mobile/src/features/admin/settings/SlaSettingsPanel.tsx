import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { adminSettingsApi, type SlaConfig } from './api/adminSettingsApi';
import SettingsCard, { AlertBanner } from './components/SettingsCard';
import AppTextInput from '../../../shared/components/AppTextInput';
import AppButton from '../../../shared/components/AppButton';
import { useUiStore } from '../../../stores/uiStore';

const PRESETS = [1, 2, 4, 8, 24, 48, 72];
type AlertState = { type: 'success' | 'error' | 'info'; msg: string } | null;

const DEFAULT: SlaConfig = { slaUrgentHours: 4, slaHighHours: 8, slaMediumHours: 24, slaLowHours: 72 };

const PRIORITIES: { key: keyof SlaConfig; label: string; emoji: string; color: string }[] = [
  { key: 'slaUrgentHours', label: 'URGENT', emoji: '🔴', color: '#ef4444' },
  { key: 'slaHighHours',   label: 'HIGH',   emoji: '🟠', color: '#f97316' },
  { key: 'slaMediumHours', label: 'MEDIUM', emoji: '🟡', color: '#f59e0b' },
  { key: 'slaLowHours',    label: 'LOW',    emoji: '🟢', color: '#10b981' },
];

const SlaSettingsPanel: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const [config,  setConfig]  = useState<SlaConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [alert,   setAlert]   = useState<AlertState>(null);

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
    // Validate ordering: URGENT ≤ HIGH ≤ MEDIUM ≤ LOW
    if (config.slaUrgentHours > config.slaHighHours) {
      showAlert('error', 'URGENT must be ≤ HIGH'); return;
    }
    if (config.slaHighHours > config.slaMediumHours) {
      showAlert('error', 'HIGH must be ≤ MEDIUM'); return;
    }
    if (config.slaMediumHours > config.slaLowHours) {
      showAlert('error', 'MEDIUM must be ≤ LOW'); return;
    }
    setSaving(true);
    try {
      const updated = await adminSettingsApi.saveSlaSettings(config);
      setConfig(updated);
      showAlert('success', 'SLA settings saved successfully');
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <SettingsCard
      icon="⏱️" title="SLA Timer Settings"
      description="Set the response time limit per priority. A live countdown appears on each ticket and turns red when breached."
      loading={loading}
    >
      {alert && <AlertBanner {...alert} isDark={isDark} />}

      {PRIORITIES.map(({ key, label, emoji, color }) => (
        <View key={key} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color, marginBottom: 8 }}>
            {emoji} {label}
          </Text>

          {/* Presets */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {PRESETS.map((p) => {
              const active = config[key] === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setConfig((c) => ({ ...c, [key]: p }))}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
                    backgroundColor: active ? color : isDark ? '#334155' : '#f1f5f9',
                    borderWidth: 1, borderColor: active ? color : isDark ? '#475569' : '#e2e8f0',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: active ? '#fff' : isDark ? '#cbd5e1' : '#475569' }}>
                    {p}h
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom input */}
          <AppTextInput
            label="Custom hours"
            value={String(config[key])}
            onChangeText={(v) => setConfig((c) => ({ ...c, [key]: Math.max(1, parseInt(v) || 1) }))}
            fieldType="number"
            placeholder="Hours"
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
      ))}

      <AppButton variant="contained" loading={saving} loadingText="Saving…" onPress={handleSave} fullWidth>
        Save SLA Settings
      </AppButton>
    </SettingsCard>
  );
};

export default SlaSettingsPanel;
