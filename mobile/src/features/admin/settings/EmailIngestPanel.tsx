import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { adminSettingsApi, type EmailConfig } from '@/src/features/admin/settings/api/adminSettingsApi';
import SettingsCard from '@/src/features/admin/settings/components/SettingsCard';
import SettingsPanelLayout from '@/src/features/admin/settings/components/SettingsPanelLayout';
import { AppButton } from '@/src/shared/components';
import { useThemeColors } from '@/src/constants/theme';

const InfoRow: React.FC<{ label: string; value: string; hint: string }> = ({ label, value, hint }) => {
  const c = useThemeColors();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: c.text.muted, marginBottom: 2 }}>{label}</Text>
      <View style={{
        backgroundColor: c.surface.secondary,
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: c.border.primary,
      }}>
        <Text style={{ fontSize: 13, color: c.text.primary, fontFamily: 'monospace' }}>{value || '—'}</Text>
      </View>
      <Text style={{ fontSize: 10, color: c.text.muted, marginTop: 2 }}>{hint}</Text>
    </View>
  );
};

const EmailIngestPanel: React.FC = () => {
  const c     = useThemeColors();
  const { t } = useTranslation();

  const [config,  setConfig]  = useState<EmailConfig>({ enabled: false, host: '', port: '993', secure: true, user: '', intervalMinutes: '5' });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    adminSettingsApi.getEmailIngest()
      .then(setConfig)
      .catch(() => Toast.show({ type: 'error', text1: t('settings.email.loadError') }))
      .finally(() => setLoading(false));
  }, []);

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const r = await adminSettingsApi.runEmailIngestNow();
      Toast.show({ type: 'success', text1: r.message });
    } catch (e) {
      Toast.show({ type: 'error', text1: e instanceof Error ? e.message : t('settings.email.runError') });
    } finally { setRunning(false); }
  };

  const steps: string[] = [
    t('settings.email.step1'),
    t('settings.email.step2'),
    t('settings.email.step3'),
    t('settings.email.step4'),
    t('settings.email.step5'),
  ];

  return (
    <SettingsPanelLayout
      footer={
        <AppButton
          variant="outline" size="large" fullWidth
          loading={running} loadingText={t('settings.email.running')}
          onPress={handleRunNow} disabled={!config.enabled}
          leftIcon={!running && <Ionicons name="mail" size={18} color={c.tint} style={{ marginEnd: 6 }} />}
        >
          {t('settings.email.runNow')}
        </AppButton>
      }
    >
      <SettingsCard
        icon={<Ionicons name="mail" size={20} color={c.tint} />}
        title={t('settings.email.title')}
        description={t('settings.email.description')}
        loading={loading}
      >
        {/* Status row */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: c.surface.secondary,
          borderRadius: 10, padding: 12, marginBottom: 16,
          borderWidth: 1, borderColor: config.enabled ? c.intent.success : c.border.primary,
        }}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.text.primary }}>
              {config.enabled ? t('settings.email.statusActive') : t('settings.email.statusInactive')}
            </Text>
            <Text style={{ fontSize: 11, color: c.text.muted, marginTop: 2 }}>
              {t('settings.email.statusHint')}
            </Text>
          </View>
        <View style={{
          width: 44, height: 26, borderRadius: 13,
          backgroundColor: config.enabled ? c.intent.success : c.interactive.disabled,
          justifyContent: 'center', paddingHorizontal: 3,
        }}>
          <View style={{
            width: 20, height: 20, borderRadius: 10, backgroundColor: c.text.inverse,
            alignSelf: config.enabled ? 'flex-end' : 'flex-start',
          }} />
        </View>
        </View>

        <InfoRow label={t('settings.email.labelHost')}     value={config.host}                                              hint="EMAIL_INGEST_HOST"             />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><InfoRow label={t('settings.email.labelPort')}   value={config.port}                                              hint="EMAIL_INGEST_PORT"   /></View>
          <View style={{ flex: 1 }}><InfoRow label={t('settings.email.labelSecure')} value={config.secure ? t('settings.email.secureYes') : t('settings.email.secureNo')} hint="EMAIL_INGEST_SECURE" /></View>
        </View>
        <InfoRow label={t('settings.email.labelInterval')} value={t('settings.email.intervalUnit', { minutes: config.intervalMinutes })} hint="EMAIL_INGEST_INTERVAL_MINUTES" />
        <InfoRow label={t('settings.email.labelUser')}     value={config.user}                                              hint="EMAIL_INGEST_USER"             />

        {!config.enabled && (
          <Text style={{ fontSize: 11, color: c.intent.error, marginBottom: 8 }}>
            {t('settings.email.disabledHint')}
          </Text>
        )}

        {/* How it works */}
        <View style={{ marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.border.primary }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.text.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('settings.email.howItWorks')}
          </Text>
          {steps.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: c.tint }}>•</Text>
              <Text style={{ fontSize: 11, color: c.text.muted, flex: 1, lineHeight: 16 }}>{step}</Text>
            </View>
          ))}
        </View>
      </SettingsCard>
    </SettingsPanelLayout>
  );
};

export default EmailIngestPanel;
