import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';

// ── AlertBanner ───────────────────────────────────────────────────────────────

interface AlertBannerProps { type: 'success' | 'error' | 'info'; msg: string }

export function AlertBanner({ type, msg }: AlertBannerProps) {
  const c     = useThemeColors();
  const bg    = type === 'success' ? c.intent.successSurface
              : type === 'error'   ? c.intent.errorSurface
              :                      c.intent.infoSurface;
  const color = type === 'success' ? c.intent.success
              : type === 'error'   ? c.intent.error
              :                      c.intent.info;
  const icon  = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 8 }}>
      <Text>{icon}</Text>
      <Text style={{ color, fontSize: 13, flex: 1 }}>{msg}</Text>
    </View>
  );
}

// ── SettingsCard ──────────────────────────────────────────────────────────────

export interface SettingsCardProps {
  icon:         string;
  title:        string;
  description?: string;
  loading?:     boolean;
  children:     React.ReactNode;
}

export default function SettingsCard({ icon, title, description, loading, children }: SettingsCardProps) {
  const c     = useThemeColors();
  const isRtl = useUiStore((s) => s.direction) === 'rtl';

  return (
    <View style={{
      backgroundColor: c.surface.primary,
      borderRadius: 12, padding: 16, marginBottom: 16,
      shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: c.text.primary, textAlign: isRtl ? 'right' : 'left' }}>
          {title}
        </Text>
      </View>
      {description && (
        <Text style={{ fontSize: 12, color: c.text.muted, marginBottom: 16, lineHeight: 18, textAlign: isRtl ? 'right' : 'left' }}>
          {description}
        </Text>
      )}
      {loading ? (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator color="#3b82f6" />
        </View>
      ) : children}
    </View>
  );
}
