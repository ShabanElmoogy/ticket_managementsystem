import React from 'react';
import { Pressable, Text } from 'react-native';

interface Props {
  onPress: () => void;
  loading?: boolean;
  isDark?: boolean;
}

/**
 * Grey "Refresh" button with loading state.
 * Reusable across any admin screen.
 */
const RefreshButton: React.FC<Props> = ({ onPress, loading = false, isDark = false }) => (
  <Pressable
    onPress={onPress}
    disabled={loading}
    style={({ pressed }) => ({
      flexDirection: 'row', alignItems: 'center', gap: 6,
      height: 36, paddingHorizontal: 12, borderRadius: 10,
      backgroundColor: pressed
        ? (isDark ? '#475569' : '#d1d5db')
        : (isDark ? '#334155' : '#e5e7eb'),
      opacity: loading ? 0.5 : 1,
    })}
  >
    <Text style={{ fontSize: 14, lineHeight: 18 }}>{loading ? '⏳' : '🔄'}</Text>
    <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#e2e8f0' : '#374151' }}>
      {loading ? 'Loading…' : 'Refresh'}
    </Text>
  </Pressable>
);

export default RefreshButton;
