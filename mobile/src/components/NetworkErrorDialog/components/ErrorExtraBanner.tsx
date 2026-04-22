import React from 'react';
import { View, Text } from 'react-native';
import type { ErrorState } from '../types';

interface Props {
  error?:    ErrorState | null;
  retrying:  boolean;
  isDark:    boolean;
}

/**
 * Renders the contextual info banner that appears above the share panel:
 * - Retrying: "Connection restored — saving your data…"
 * - Network flood: "N requests failed simultaneously"
 * - Dev API details: raw response body (DEV only)
 */
const ErrorExtraBanner: React.FC<Props> = ({ error, retrying, isDark }) => {
  if (retrying) {
    return (
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: isDark ? '#0c2a1a' : '#f0fdf4',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
        marginBottom: 4,
      }}>
        <Text style={{ fontSize: 14 }}>🔄</Text>
        <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '600' }}>
          Connection restored — saving your data…
        </Text>
      </View>
    );
  }

  if (error?.kind === 'network' && error.count > 1) {
    return (
      <View style={{
        backgroundColor: isDark ? '#3b1515' : '#fef2f2',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
        marginBottom: 4,
      }}>
        <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>
          {error.count} requests failed simultaneously
        </Text>
      </View>
    );
  }

  if (error?.kind === 'api' && __DEV__ && error.details) {
    return (
      <View style={{
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
        borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
        marginBottom: 4,
      }}>
        <Text style={{
          fontSize: 10, color: isDark ? '#64748b' : '#94a3b8',
          fontWeight: '700', marginBottom: 4,
        }}>
          DEV — RESPONSE DETAILS
        </Text>
        <Text
          style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', fontFamily: 'monospace' }}
          numberOfLines={4}
        >
          {typeof error.details === 'string'
            ? error.details
            : JSON.stringify(error.details, null, 2)}
        </Text>
      </View>
    );
  }

  return null;
};

export default ErrorExtraBanner;
