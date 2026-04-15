import React, { useState, useEffect } from 'react';
import { View, Text, Switch } from 'react-native';
import { adminSettingsApi, type EmailConfig } from './api/adminSettingsApi';
import SettingsCard, { AlertBanner } from './components/SettingsCard';
import AppButton from '../../../shared/components/AppButton';
import { useUiStore } from '../../../stores/uiStore';

type AlertState = { type: 'success' | 'error' | 'info'; msg: string } | null;

const InfoRow: React.FC<{ label: string; value: string; hint: string; isDark: boolean }> = ({ label, value, hint, isDark }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#64748b' : '#94a3b8', marginBottom: 2 }}>{label}</Text>
    <View style={{
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
      borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
    }}>
      <Text style={{ fontSize: 13, color: isDark ? '#e2e8f0' : '#1e293b', fontFamily: 'monospace' }}>{value || '—'}</Text>
    </View>
    <Text style={{ fontSize: 10, color: isDark ? '#475569' : '#94a3b8', marginTop: 2 }}>{hint}</Text>
  </View>
);

const HOW_IT_WORKS = [
  'Connects to your IMAP mailbox and fetches UNSEEN messages',
  'Subject → ticket title, body → ticket description',
  'Sender email is matched to an existing customer automatically',
  'Tenant is resolved from the Support Email set on each tenant',
  'Processed emails are marked as Seen to avoid duplicates',
];

const EmailIngestPanel: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const [config,  setConfig]  = useState<EmailConfig>({ enabled: false, host: '', port: '993', secure: true, user: '', intervalMinutes: '5' });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [alert,   setAlert]   = useState<AlertState>(null);

  const showAlert = (type: AlertState['type'], msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    adminSettingsApi.getEmailIngest()
      .then(setConfig)
      .catch(() => showAlert('error', 'Failed to load email settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const r = await adminSettingsApi.runEmailIngestNow();
      showAlert('success', r.message);
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to trigger ingestion');
    } finally { setRunning(false); }
  };

  return (
    <SettingsCard
      icon="📧" title="Email-to-Ticket"
      description="Automatically create tickets from incoming emails via IMAP. Configure credentials in the server .env file."
      loading={loading}
    >
      {alert && <AlertBanner {...alert} isDark={isDark} />}

      {/* Status row */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        borderRadius: 10, padding: 12, marginBottom: 16,
        borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
      }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#f1f5f9' : '#0f172a' }}>
            Ingestion {config.enabled ? 'Active' : 'Inactive'}
          </Text>
          <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginTop: 2 }}>
            Set EMAIL_INGEST_ENABLED in .env
          </Text>
        </View>
        <Switch value={config.enabled} disabled thumbColor={config.enabled ? '#10b981' : '#94a3b8'} />
      </View>

      {/* Config fields (read-only) */}
      <InfoRow label="IMAP Host"     value={config.host}                    hint="EMAIL_INGEST_HOST"             isDark={isDark} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <InfoRow label="Port"      value={config.port}                    hint="EMAIL_INGEST_PORT"             isDark={isDark} />
        </View>
        <View style={{ flex: 1 }}>
          <InfoRow label="Secure"    value={config.secure ? 'Yes (TLS)' : 'No'} hint="EMAIL_INGEST_SECURE"     isDark={isDark} />
        </View>
      </View>
      <InfoRow label="Poll Interval" value={`${config.intervalMinutes} min`} hint="EMAIL_INGEST_INTERVAL_MINUTES" isDark={isDark} />
      <InfoRow label="Mailbox User"  value={config.user}                    hint="EMAIL_INGEST_USER"             isDark={isDark} />

      {/* Run now */}
      <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#f1f5f9', marginTop: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Manual Trigger
        </Text>
        <AppButton variant="outlined" color="primary" loading={running} loadingText="Running…"
          onPress={handleRunNow} disabled={!config.enabled}>
          ▶ Fetch Emails Now
        </AppButton>
        {!config.enabled && (
          <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>Enable ingestion first in .env</Text>
        )}
      </View>

      {/* How it works */}
      <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#f1f5f9' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          How It Works
        </Text>
        {HOW_IT_WORKS.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: '#3b82f6' }}>•</Text>
            <Text style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', flex: 1, lineHeight: 16 }}>{item}</Text>
          </View>
        ))}
      </View>
    </SettingsCard>
  );
};

export default EmailIngestPanel;
