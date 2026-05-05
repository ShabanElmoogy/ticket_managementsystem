import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { adminSettingsApi, type EscalationConfig } from '@/src/features/admin/settings/api/adminSettingsApi';
import SettingsCard, { AlertBanner } from '@/src/features/admin/settings/components/SettingsCard';
import SettingsPanelLayout from '@/src/features/admin/settings/components/SettingsPanelLayout';
import { AppTextInput, AppButton } from '@/src/shared/components';
import { useAuthStore } from '@/src/stores/authStore';
import { useThemeColors } from '@/src/constants/theme';

const PRESETS = [1, 15, 30, 60, 360, 1440];

type AlertState = { type: 'success' | 'error' | 'info'; msg: string } | null;

const SchedulerSettingsPanel: React.FC = () => {
  const { user }     = useAuthStore();
  const c            = useThemeColors();
  const { t }        = useTranslation();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [interval, setInterval] = useState('60');
  const [scope,    setScope]    = useState<EscalationConfig['scope']>('tenant');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [running,  setRunning]  = useState(false);
  const [alert,    setAlert]    = useState<AlertState>(null);

  const showAlert = (type: NonNullable<AlertState>['type'], msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    adminSettingsApi.getEscalationSettings()
      .then((r) => { setInterval(String(r.intervalMinutes)); setScope(r.scope); })
      .catch(() => showAlert('error', t('settings.scheduler.loadError')))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const val = parseInt(interval);
    if (!val || val < 1) { showAlert('error', t('settings.scheduler.errorMinInterval')); return; }
    setSaving(true);
    try {
      const r = await adminSettingsApi.saveEscalationSettings(val);
      setInterval(String(r.intervalMinutes));
      showAlert('success', t('settings.scheduler.saveSuccess', { minutes: r.intervalMinutes }));
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : t('settings.scheduler.saveError'));
    } finally { setSaving(false); }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await adminSettingsApi.runEscalationNow();
      showAlert('success', t('settings.scheduler.runSuccess'));
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : t('settings.scheduler.runError'));
    } finally { setRunning(false); }
  };

  return (
    <SettingsPanelLayout
      footer={
        <AppButton
          variant="contained" size="large" fullWidth
          loading={saving} loadingText={t('common.saving')}
          onPress={handleSave} disabled={!interval || parseInt(interval) < 1}
          leftIcon={!saving && <Ionicons name="save-outline" size={18} color="#fff" style={{ marginEnd: 6 }} />}
        >
          {t('settings.scheduler.save')}
        </AppButton>
      }
    >
      <SettingsCard
        icon="⏰" title={t('settings.scheduler.title')}
        description={scope === 'global'
          ? t('settings.scheduler.descriptionGlobal')
          : t('settings.scheduler.description')}
        loading={loading}
      >
        {alert && <AlertBanner {...alert} />}

        {/* Scope badge */}
        <View style={{
          alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
          backgroundColor: scope === 'global' ? c.intent.warningSurface : c.intent.infoSurface,
          borderWidth: 1, borderColor: scope === 'global' ? c.intent.warning : c.tint,
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: scope === 'global' ? c.intent.warning : c.tint }}>
            {scope === 'global' ? t('settings.scheduler.scopeGlobal') : t('settings.scheduler.scopeTenant')}
          </Text>
        </View>

        {/* Presets */}
        <Text style={{ fontSize: 11, fontWeight: '700', color: c.text.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('settings.scheduler.quickPresets')}
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
                  backgroundColor: active ? c.tint : c.surface.tertiary,
                  borderWidth: 1, borderColor: active ? c.tint : c.border.primary,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? c.text.inverse : c.text.secondary }}>
                  {t(`settings.scheduler.preset_${p}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom input */}
        <AppTextInput
          label={t('settings.scheduler.intervalLabel')}
          value={interval} onChangeText={setInterval}
          fieldType="number" placeholder="60"
          containerStyle={{ marginBottom: 0 }}
        />

        {/* Run now — SUPER_ADMIN only */}
        {isSuperAdmin && (
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.border.primary }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.text.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('settings.scheduler.manualTrigger')}
            </Text>
            <AppButton variant="outline" loading={running} loadingText={t('settings.scheduler.running')} onPress={handleRunNow}>
              {t('settings.scheduler.runNow')}
            </AppButton>
            <Text style={{ fontSize: 11, color: c.text.muted, marginTop: 6 }}>
              {t('settings.scheduler.runNowHint')}
            </Text>
          </View>
        )}
      </SettingsCard>
    </SettingsPanelLayout>
  );
};

export default SchedulerSettingsPanel;
