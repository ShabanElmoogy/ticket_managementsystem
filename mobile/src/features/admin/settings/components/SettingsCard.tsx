/**
 * SettingsCard — container for a settings section.
 * Matches web's <Paper sx={{ p: 3 }}> pattern.
 */
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useUiStore } from '../../../../stores/uiStore';

interface AlertBannerProps { type: 'success' | 'error' | 'info'; msg: string; isDark: boolean }

export const AlertBanner: React.FC<AlertBannerProps> = ({ type, msg, isDark }) => {
  const bg    = type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : '#dbeafe';
  const color = type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : '#1e40af';
  const icon  = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 8 }}>
      <Text>{icon}</Text>
      <Text style={{ color, fontSize: 13, flex: 1 }}>{msg}</Text>
    </View>
  );
};

interface SettingsCardProps {
  icon: string;
  title: string;
  description?: string;
  loading?: boolean;
  children: React.ReactNode;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ icon, title, description, loading, children }) => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  return (
    <View style={{
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: 12, padding: 16, marginBottom: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a' }}>{title}</Text>
      </View>
      {description && (
        <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 16, lineHeight: 18 }}>
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
};

export default SettingsCard;
