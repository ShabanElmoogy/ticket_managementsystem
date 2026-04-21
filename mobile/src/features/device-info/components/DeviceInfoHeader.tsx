import React from 'react';
import { View, Text, Platform } from 'react-native';

interface Props {
  isDark: boolean;
  osVersion: string | number;
}

const DeviceInfoHeader: React.FC<Props> = ({ isDark, osVersion }) => (
  <View style={{
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#e2e8f0',
    backgroundColor: isDark ? '#1e293b' : '#fff',
    flexDirection: 'row', alignItems: 'center', gap: 10,
  }}>
    <Text style={{ fontSize: 22 }}>📱</Text>
    <View>
      <Text style={{ fontSize: 17, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a' }}>
        Device Info
      </Text>
      <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', marginTop: 1 }}>
        {Platform.OS.toUpperCase()} · v{String(osVersion)}
      </Text>
    </View>
  </View>
);

export default DeviceInfoHeader;
