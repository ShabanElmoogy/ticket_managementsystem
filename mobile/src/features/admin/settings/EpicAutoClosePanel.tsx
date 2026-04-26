import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { adminSettingsApi } from '@/src/features/admin/settings/api/adminSettingsApi';
import SettingsCard, { AlertBanner } from '@/src/features/admin/settings/components/SettingsCard';
import { useThemeColors } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';

type AlertState = { type: 'success' | 'error' | 'info'; msg: string } | null;

// ── Custom toggle ─────────────────────────────────────────────────────────────

const Toggle: React.FC<{ value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean }> = ({
  value, onValueChange, disabled,
}) => (
  <Pressable
    onPress={() => !disabled && onValueChange(!value)}
    style={{
      width: 52, height: 30, borderRadius: 15,
      backgroundColor: value ? '#10b981' : '#d1d5db',
      justifyContent: 'center', paddingHorizontal: 3,
      opacity: disabled ? 0.5 : 1, flexShrink: 0,
    }}
    accessibilityRole="switch"
    accessibilityState={{ checked: value, disabled }}
  >
    <View style={{
      width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25, shadowRadius: 2, elevation: 2,
      alignSelf: value ? 'flex-end' : 'flex-start',
    }} />
  </Pressable>
);

// ── Badge ─────────────────────────────────────────────────────────────────────

const Badge: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const c = useThemeColors();
  return (
    <View style={{
      backgroundColor: enabled ? '#dcfce7' : c.surface.tertiary,
      borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: enabled ? '#166534' : c.text.muted }}>
        {enabled ? 'ON' : 'OFF'}
      </Text>
    </View>
  );
};

// ── Panel ─────────────────────────────────────────────────────────────────────

const EpicAutoClosePanel: React.FC = () => {
  const c     = useThemeColors();
  const isRtl = useUiStore((s) => s.direction) === 'rtl';

  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [alert,   setAlert]   = useState<AlertState>(null);

  const showAlert = (type: 'success' | 'error' | 'info', msg: string) => {
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

  const toggleEl = saving
    ? <ActivityIndicator size="small" color="#10b981" />
    : <Toggle value={enabled} onValueChange={handleToggle} />;

  return (
    <SettingsCard
      icon="🌳" title="Epic Auto-Close"
      description="When all features in an epic are SHIPPED and all linked tickets are RESOLVED or CLOSED, automatically transition the epic to COMPLETED."
      loading={loading}
    >
      {alert && <AlertBanner type={alert.type} msg={alert.msg} />}

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surface.secondary,
        borderRadius: 10, padding: 14,
        borderWidth: 1,
        borderColor: enabled ? c.intent.successSurface : c.border.primary,
      }}>
        <View style={{ flex: 1, marginRight: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: c.text.primary }}>
              {enabled ? 'Auto-close enabled' : 'Auto-close disabled'}
            </Text>
            <Badge enabled={enabled} />
          </View>
          <Text style={{ fontSize: 12, lineHeight: 16, color: c.text.muted, textAlign: isRtl ? 'right' : 'left' }}>
            {enabled
              ? 'Epics will be automatically completed when all conditions are met.'
              : 'A confirmation dialog will always be shown before closing an epic.'}
          </Text>
        </View>
        {toggleEl}
      </View>
    </SettingsCard>
  );
};

export default EpicAutoClosePanel;
