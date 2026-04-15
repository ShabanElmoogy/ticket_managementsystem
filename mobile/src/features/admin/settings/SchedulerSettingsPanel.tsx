import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { adminSettingsApi, type EscalationConfig } from './api/adminSettingsApi';
import SettingsCard, { AlertBanner } from './components/SettingsCard';
import AppTextInput from '../../../shared/components/AppTextInput';
import AppButton from '../../../shared/components/AppButton';
import { useAuthStore } from '../../../stores/authStore';
import { useUiStore } from '../../../stores/uiStore';

const PRESETS = [1, 15, 30, 60, 360, 1440];
const PRESET_LABELS: Record<number, string> = {
  1: '1 min', 15: '15 min', 30: '30 min',
  60: '1 hr', 360: '6 hrs', 1440: '24 hrs',
};

type AlertState = { type: 'success' | 'error' | 'info'; msg: string } | null;

const SchedulerSettingsPanel: React.FC = () => {
  const { user }     = useAuthStore();
  const { colorMode } = useUiStore();
  const isDark       = colorMode === 'dark';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [interval, setInterval] = useState('60');
  const [scope,    setScope]    = useState<EscalationConfig['scope']>('tenant');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [running,  setRunning]  = useState(false);
  const [alert,    setAlert]    = useState<AlertState>(null);

  const showAlert = (type: AlertState['type'], msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    adminSettingsApi.getEscalationSettings()
      .then((r) => { setInterval(String(r.intervalMinutes)); setScope(r.scope); })
      .catch(() => showAlert('error', 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const val = parseInt(interval);
    if (!val || val < 1) { showAlert('error', 'Interval must be at least 1 minute'); return; }
    setSaving(true);
    try {
      const r = await adminSettingsApi.saveEscalationSettings(val);
      setInterval(String(r.intervalMinutes));
      showAlert('success', `Interval updated to ${r.intervalMinutes} minute(s)`);
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await adminSettingsApi.runEscalationNow();
      showAlert('success', 'Escalation triggered successfully');
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to trigger');
    } finally { setRunning(false); }
  };

  return (
    <SettingsCard
      icon="⏰" title="Priority Auto-Escalation"
      description={scope === 'global'
        ? 'Sets the default check interval for all tenants.'
        : 'Controls how often overdue tickets are escalated one priority level: LOW → MEDIUM → HIGH → URGENT.'}
      loading={loading}
    >
      {alert && <AlertBanner {...alert} isDark={isDark} />}

      {/* Scope badge */}
      <View style={{
        alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
        backgroundColor: scope === 'global' ? '#fef3c718' : '#dbeafe',
        borderWidth: 1, borderColor: scope === 'global' ? '#f59e0b' : '#3b82f6',
        marginBottom: 16,
      }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: scope === 'global' ? '#d97706' : '#2563eb' }}>
          {scope === 'global' ? '🌐 Global (all tenants)' : '🏢 This tenant only'}
        </Text>
      </View>

      {/* Presets */}
      <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Quick Presets
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {PRESETS.map((p) => {
          const active = parseInt(interval) === p;
          return (
            <Pressable
              key={p}
              onPress={() => setInterval(String(p))}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
                backgroundColor: active ? '#3b82f6' : isDark ? '#334155' : '#f1f5f9',
                borderWidth: 1, borderColor: active ? '#3b82f6' : isDark ? '#475569' : '#e2e8f0',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : isDark ? '#cbd5e1' : '#475569' }}>
                {PRESET_LABELS[p]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom input + save */}
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <AppTextInput
            label="Interval (minutes)"
            value={interval}
            onChangeText={setInterval}
            fieldType="number"
            placeholder="60"
          />
        </View>
        <AppButton variant="contained" loading={saving} loadingText="Saving…" onPress={handleSave}
          disabled={!interval || parseInt(interval) < 1} style={{ marginBottom: 12 }}>
          Save
        </AppButton>
      </View>

      {/* Run now — SUPER_ADMIN only */}
      {isSuperAdmin && (
        <View style={{ marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#f1f5f9' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Manual Trigger
          </Text>
          <AppButton variant="outlined" color="warning" loading={running} loadingText="Running…" onPress={handleRunNow}>
            ▶ Run Escalation Now
          </AppButton>
          <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginTop: 6 }}>
            Immediately escalates all eligible overdue tickets across all tenants.
          </Text>
        </View>
      )}
    </SettingsCard>
  );
};

export default SchedulerSettingsPanel;
