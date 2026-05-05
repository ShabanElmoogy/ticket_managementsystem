import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
import { AppButton, AppTextInput } from '@/src/shared/components';
import SettingsCard from '@/src/features/admin/settings/components/SettingsCard';
import SettingsPanelLayout from '@/src/features/admin/settings/components/SettingsPanelLayout';
import { adminSettingsApi, type PaginationConfig } from '@/src/features/admin/settings/api/adminSettingsApi';
import { usePaginationStore } from '@/src/stores/paginationStore';

type Mode = 'SERVER' | 'CLIENT';
type AlertState = { type: 'success' | 'error'; msg: string } | null;

const AlertBanner: React.FC<{ type: 'success' | 'error'; msg: string }> = ({ type, msg }) => {
  const c = useThemeColors();
  return (
    <View style={{
      backgroundColor: type === 'success' ? c.intent.successSurface : c.intent.errorSurface,
      borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 8,
    }}>
      <Text>{type === 'success' ? '✅' : '❌'}</Text>
      <Text style={{ fontSize: 13, color: type === 'success' ? c.intent.success : c.intent.error, flex: 1 }}>{msg}</Text>
    </View>
  );
};

const Toggle: React.FC<{
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ value, onValueChange, disabled }) => {
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

const ModeSelector: React.FC<{ value: Mode; onChange: (m: Mode) => void }> = ({ value, onChange }) => {
  const c     = useThemeColors();
  const { t } = useTranslation();

  const options: { id: Mode; icon: string; label: string; desc: string }[] = [
    { id: 'SERVER', icon: '🖥️', label: t('settings.pagination.modeServer'),     desc: t('settings.pagination.modeServerDesc') },
    { id: 'CLIENT', icon: '📱', label: t('settings.pagination.modeClient'),     desc: t('settings.pagination.modeClientDesc') },
  ];

  return (
    <View style={{ gap: 8, marginBottom: 16 }}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              padding: 14, borderRadius: 10,
              backgroundColor: active ? c.intent.infoSurface : c.surface.secondary,
              borderWidth: 2,
              borderColor: active ? c.tint : c.border.primary,
            }}
          >
            <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: active ? c.tint : c.text.primary }}>
                  {opt.label}
                </Text>
                {active && (
                  <View style={{ backgroundColor: c.tint, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: c.text.inverse }}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: c.text.muted, marginTop: 2, lineHeight: 16 }}>{opt.desc}</Text>
            </View>
            <View style={{
              width: 20, height: 20, borderRadius: 10,
              borderWidth: 2, borderColor: active ? c.tint : c.border.primary,
              backgroundColor: active ? c.tint : 'transparent',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.text.inverse }} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const NumberRow: React.FC<{
  label: string; hint: string; value: number;
  min: number; max: number; presets: number[];
  onChange: (n: number) => void;
}> = ({ label, hint, value, min, max, presets, onChange }) => {
  const c = useThemeColors();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: c.text.primary, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 11, color: c.text.muted, marginBottom: 8 }}>{hint}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {presets.map((p) => {
          const active = value === p;
          return (
            <Pressable
              key={p}
              onPress={() => onChange(p)}
              style={{
                paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16,
                backgroundColor: active ? c.tint : c.surface.tertiary,
                borderWidth: 1, borderColor: active ? c.tint : c.border.primary,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: active ? c.text.inverse : c.text.secondary }}>
                {p}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <AppTextInput
        label=""
        value={String(value)}
        onChangeText={(v) => { const n = parseInt(v, 10); if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n))); }}
        fieldType="number"
        placeholder={`${min}–${max}`}
        containerStyle={{ marginBottom: 0 }}
      />
    </View>
  );
};

const PaginationSettingsPanel: React.FC = () => {
  const c   = useThemeColors();
  const { t } = useTranslation();
  const setPaginationSettings = usePaginationStore((s) => s.setSettings);

  const [mode,             setMode]             = useState<Mode>('SERVER');
  const [defaultPageSize,  setDefaultPageSize]  = useState(20);
  const [maxPageSize,      setMaxPageSize]      = useState(100);
  const [allowOverride,    setAllowOverride]    = useState(true);
  const [maxClientRecords, setMaxClientRecords] = useState(500);
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(false);
  const [alert,            setAlert]            = useState<AlertState>(null);

  const showAlert = (type: NonNullable<AlertState>['type'], msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    adminSettingsApi.getPaginationSettings()
      .then((r) => {
        setMode(r.paginationMode);
        setDefaultPageSize(r.defaultPageSize);
        setMaxPageSize(r.maxPageSize);
        setAllowOverride(r.allowUserOverride);
        setMaxClientRecords(r.maxClientRecords);
      })
      .catch(() => showAlert('error', t('settings.pagination.loadError')))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (defaultPageSize > maxPageSize) { showAlert('error', t('settings.pagination.errorDefaultExceedsMax')); return; }
    setSaving(true);
    try {
      const updated = await adminSettingsApi.savePaginationSettings({
        paginationMode: mode, defaultPageSize, maxPageSize,
        allowUserOverride: allowOverride, maxClientRecords,
      });
      setPaginationSettings({
        paginationMode:    updated.paginationMode,
        defaultPageSize:   updated.defaultPageSize,
        maxPageSize:       updated.maxPageSize,
        allowUserOverride: updated.allowUserOverride,
        maxClientRecords:  updated.maxClientRecords,
      });
      showAlert('success', t('settings.pagination.saveSuccess'));
    } catch (e) {
      showAlert('error', e instanceof Error ? e.message : t('settings.pagination.saveError'));
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
          {t('settings.pagination.save')}
        </AppButton>
      }
    >
    <SettingsCard icon="📄" title={t('settings.pagination.title')} description={t('settings.pagination.description')} loading={loading}>
      {alert && <AlertBanner type={alert.type} msg={alert.msg} />}

      <Text style={{ fontSize: 11, fontWeight: '700', color: c.text.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {t('settings.pagination.mode')}
      </Text>
      <ModeSelector value={mode} onChange={setMode} />

      <Text style={{ fontSize: 11, fontWeight: '700', color: c.text.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {t('settings.pagination.pageSizes')}
      </Text>
      <NumberRow label={t('settings.pagination.defaultPageSize')} hint={t('settings.pagination.defaultPageSizeHint')} value={defaultPageSize} min={5} max={200} presets={[10, 20, 50, 100]} onChange={setDefaultPageSize} />
      <NumberRow label={t('settings.pagination.maxPageSize')}     hint={t('settings.pagination.maxPageSizeHint')}     value={maxPageSize}     min={5} max={500} presets={[50, 100, 200, 500]} onChange={setMaxPageSize} />

      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: c.surface.secondary,
        borderRadius: 10, padding: 14, marginBottom: 16,
        borderWidth: 1, borderColor: c.border.primary,
      }}>
        <View style={{ flex: 1, marginEnd: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.text.primary }}>{t('settings.pagination.allowOverride')}</Text>
          <Text style={{ fontSize: 12, color: c.text.muted, marginTop: 2, lineHeight: 16 }}>{t('settings.pagination.allowOverrideHint')}</Text>
        </View>
        <Toggle value={allowOverride} onValueChange={setAllowOverride} />
      </View>

      {mode === 'CLIENT' && (
        <>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.text.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('settings.pagination.clientMode')}
          </Text>
          <NumberRow label={t('settings.pagination.maxClientRecords')} hint={t('settings.pagination.maxClientRecordsHint')} value={maxClientRecords} min={50} max={5000} presets={[100, 250, 500, 1000]} onChange={setMaxClientRecords} />
          <View style={{ backgroundColor: c.intent.warningSurface, borderRadius: 8, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 8 }}>
            <Text>⚠️</Text>
            <Text style={{ fontSize: 12, color: c.intent.warning, flex: 1, lineHeight: 16 }}>{t('settings.pagination.clientModeWarning')}</Text>
          </View>
        </>
      )}

    </SettingsCard>
    </SettingsPanelLayout>
  );
};

export default PaginationSettingsPanel;
