import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminSettingsApi, type SlaConfig } from '@/src/features/admin/settings/api/adminSettingsApi';
import SettingsCard, { AlertBanner } from '@/src/features/admin/settings/components/SettingsCard';
import SettingsPanelLayout from '@/src/features/admin/settings/components/SettingsPanelLayout';
import { AppTextInput, AppButton } from '@/src/shared/components';
import { useThemeColors } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { PriorityColors } from '@/src/constants/tokens';

const PRESETS = [1, 2, 4, 8, 24, 48, 72];
type AlertState = { type: 'success' | 'error' | 'info'; msg: string } | null;

const DEFAULT: SlaConfig = { slaUrgentHours: 4, slaHighHours: 8, slaMediumHours: 24, slaLowHours: 72 };

const PRIORITIES: { key: keyof SlaConfig; label: string; emoji: string; colorKey: string }[] = [
  { key: 'slaUrgentHours', label: 'URGENT', emoji: '🔴', colorKey: 'URGENT' },
  { key: 'slaHighHours',   label: 'HIGH',   emoji: '🟠', colorKey: 'HIGH'   },
  { key: 'slaMediumHours', label: 'MEDIUM', emoji: '🟡', colorKey: 'MEDIUM' },
  { key: 'slaLowHours',    label: 'LOW',    emoji: '🟢', colorKey: 'LOW'    },
];

const SlaSettingsPanel: React.FC = () => {
  const c     = useThemeColors();
  const { t } = useTranslation();

  const [config,  setConfig]  = useState<SlaConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [alert,   setAlert]   = useState<AlertState>(null);

  const showAlert = (type: NonNullable<AlertState>['type'], msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    adminSettingsApi.getSlaSettings()
      .then(setConfig)
      .catch(() => showAlert('error', t('settings.sla.loadError')))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (config.slaUrgentHours > config.slaHighHours)   { showAlert('error', t('settings.sla.errorUrgentHigh')); return; }
    if (config.slaHighHours   > config.slaMediumHours) { showAlert('error', t('settings.sla.errorHighMedium')); return; }
    if (config.slaMediumHours > config.slaLowHours)    { showAlert('error', t('settings.sla.errorMediumLow'));  return; }
    setSaving(true);
    try {
      const updated = await adminSettingsApi.saveSlaSettings(config);
      setConfig(updated);
      showAlert('success', t('settings.sla.saveSuccess'));
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : t('settings.sla.saveError'));
    } finally { setSaving(false); }
  };

  return (
    <SettingsPanelLayout
      footer={
        <AppButton
          variant="contained" size="large" fullWidth
          loading={saving} loadingText={t('common.saving')}
          onPress={handleSave}
          leftIcon={!saving && <Ionicons name="save-outline" size={18} color="#fff" style={{ marginEnd: 6 }} />}
        >
          {t('settings.sla.save')}
        </AppButton>
      }
    >
    <SettingsCard
      icon="⏱️" title={t('settings.sla.title')}
      description={t('settings.sla.description')}
      loading={loading}
    >
      {alert && <AlertBanner {...alert} />}

      {PRIORITIES.map(({ key, label, emoji, colorKey }) => {
        const color = PriorityColors[colorKey];
        return (
          <View key={key} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color, marginBottom: 8 }}>
              {emoji} {t(`settings.sla.priority.${colorKey}`)}
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {PRESETS.map((p) => {
                const active = config[key] === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setConfig((prev) => ({ ...prev, [key]: p }))}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
                      backgroundColor: active ? color : c.surface.tertiary,
                      borderWidth: 1, borderColor: active ? color : c.border.primary,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: active ? c.text.inverse : c.text.secondary }}>
                      {t('settings.sla.hoursUnit', { h: p })}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <AppTextInput
              label={t('settings.sla.customHours')}
              value={String(config[key])}
              onChangeText={(v) => setConfig((prev) => ({ ...prev, [key]: Math.max(1, parseInt(v) || 1) }))}
              fieldType="number"
              placeholder={t('settings.sla.hoursPlaceholder')}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
        );
      })}

    </SettingsCard>
    </SettingsPanelLayout>
  );
};

export default SlaSettingsPanel;
