import React, { useState, useEffect } from 'react';
import { View, Text, Switch, ActivityIndicator } from 'react-native';
import { adminSettingsApi } from './api/adminSettingsApi';
import SettingsCard, { AlertBanner } from './components/SettingsCard';
import { useUiStore } from '../../../stores/uiStore';

type AlertState = { type: 'success' | 'error' | 'info'; msg: string } | null;

const EpicAutoClosePanel: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [alert,   setAlert]   = useState<AlertState>(null);

  const showAlert = (type: AlertState['type'], msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    adminSettingsApi.getEpicAutoClose()
      .then((r) => setEnabled(r.epicAutoClose))
      .catch(() => showAlert('error', 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    try {
      const r = await adminSettingsApi.saveEpicAutoClose(value);
      setEnabled(r.epicAutoClose);
      showAlert('success', `Epic auto-close ${r.epicAutoClose ? 'enabled' : 'disabled'}`);
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <SettingsCard
      icon="🌳" title="Epic Auto-Close"
      description="When all features in an epic are SHIPPED and all linked tickets are RESOLVED or CLOSED, automatically transition the epic to COMPLETED."
      loading={loading}
    >
      {alert && <AlertBanner {...alert} isDark={isDark} />}

      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        borderRadius: 10, padding: 14,
        borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
      }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {enabled ? 'Auto-close enabled' : 'Auto-close disabled'}
          </Text>
          <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', marginTop: 3, lineHeight: 16 }}>
            {enabled
              ? 'Epics will be automatically completed when all conditions are met.'
              : 'A confirmation dialog will always be shown before closing an epic.'}
          </Text>
        </View>
        {saving
          ? <ActivityIndicator size="small" color="#10b981" />
          : <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: '#94a3b8', true: '#10b981' }}
              thumbColor="#fff"
            />
        }
      </View>
    </SettingsCard>
  );
};

export default EpicAutoClosePanel;
