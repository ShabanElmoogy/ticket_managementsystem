import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { adminSettingsApi } from '@/src/features/admin/settings/api/adminSettingsApi';
import SettingsCard from '@/src/features/admin/settings/components/SettingsCard';
import { useThemeColors } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';

const Toggle: React.FC<{ value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean }> = ({
  value, onValueChange, disabled,
}) => {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={{
        width: 52, height: 30, borderRadius: 15,
        backgroundColor: value ? c.tint : c.interactive.disabled,
        justifyContent: 'center', paddingHorizontal: 3,
        opacity: disabled ? 0.5 : 1, flexShrink: 0,
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
    >
      <View style={{
        width: 24, height: 24, borderRadius: 12, backgroundColor: c.text.inverse,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25, shadowRadius: 2, elevation: 2,
        alignSelf: value ? 'flex-end' : 'flex-start',
      }} />
    </Pressable>
  );
};

const Badge: React.FC<{ enabled: boolean; labelOn: string; labelOff: string }> = ({ enabled, labelOn, labelOff }) => {
  const c = useThemeColors();
  return (
    <View style={{
      backgroundColor: enabled ? c.interactive.chipActiveBg : c.surface.tertiary,
      borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: enabled ? c.text.inverse : c.text.muted }}>
        {enabled ? labelOn : labelOff}
      </Text>
    </View>
  );
};

const EpicAutoClosePanel: React.FC = () => {
  const c     = useThemeColors();
  const { t } = useTranslation();
  const isRtl = useUiStore((s) => s.direction) === 'rtl';

  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    adminSettingsApi.getEpicAutoClose()
      .then((r) => setEnabled(r.epicAutoClose))
      .catch(() => Toast.show({ type: 'error', text1: t('settings.epicAutoClose.loadError') }))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (value: boolean) => {
    setSaving(true);
    try {
      const r = await adminSettingsApi.saveEpicAutoClose(value);
      setEnabled(r.epicAutoClose);
      Toast.show({ type: 'success', text1: r.epicAutoClose ? t('settings.epicAutoClose.toastEnabled') : t('settings.epicAutoClose.toastDisabled') });
    } catch (e) {
      Toast.show({ type: 'error', text1: e instanceof Error ? e.message : t('settings.epicAutoClose.saveError') });
    } finally { setSaving(false); }
  };

  const toggleEl = saving
    ? <ActivityIndicator size="small" color={c.tint} />
    : <Toggle value={enabled} onValueChange={handleToggle} />;

  return (
    <SettingsCard
      icon={<Ionicons name="git-merge" size={20} color={c.tint} />}
      title={t('settings.epicAutoClose.title')}
      description={t('settings.epicAutoClose.description')}
      loading={loading}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.surface.secondary,
        borderRadius: 10, 
        padding: 14,
        borderWidth: 1,
        borderColor: enabled ? c.tint : c.border.primary,
      }}>
        <View style={{ flex: 1, marginEnd: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: c.text.primary }}>
              {enabled ? t('settings.epicAutoClose.statusEnabled') : t('settings.epicAutoClose.statusDisabled')}
            </Text>
            <Badge enabled={enabled} labelOn={t('settings.epicAutoClose.badgeOn')} labelOff={t('settings.epicAutoClose.badgeOff')} />
          </View>
          <Text style={{ fontSize: 12, lineHeight: 16, color: c.text.muted, textAlign: isRtl ? 'right' : 'left' }}>
            {enabled ? t('settings.epicAutoClose.hintEnabled') : t('settings.epicAutoClose.hintDisabled')}
          </Text>
        </View>
        {toggleEl}
      </View>
    </SettingsCard>
  );
};

export default EpicAutoClosePanel;
