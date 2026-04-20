import React from 'react';
import { View, Text } from 'react-native';

// ── Color maps ────────────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  OPEN:        '#f59e0b',
  IN_PROGRESS: '#8b5cf6',
  RESOLVED:    '#10b981',
  CLOSED:      '#64748b',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW:    '#10b981',
  MEDIUM: '#f59e0b',
  HIGH:   '#ef4444',
  URGENT: '#dc2626',
};

// ── Column widths — same value in TH and TD guarantees alignment ──────────────

export const W = {
  customer: 180,
  num:       72,
  pct:       72,
  status:    90,
  priority:  80,
  title:    200,
  name:     140,
};

// ── Badge ─────────────────────────────────────────────────────────────────────

export const Badge: React.FC<{ label: string | number; color: string }> = ({ label, color }) => (
  <View style={{
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    backgroundColor: color + '22', borderWidth: 1, borderColor: color + '55',
    alignSelf: 'center',
  }}>
    <Text style={{ fontSize: 11, fontWeight: '700', color }}>{label}</Text>
  </View>
);

// ── TH — header cell ──────────────────────────────────────────────────────────

export const TH: React.FC<{ children: string; width: number; isDark: boolean }> = ({ children, width, isDark }) => (
  <Text style={{
    width, fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.4, color: isDark ? '#94a3b8' : '#64748b',
    textAlign: 'center', paddingVertical: 10, paddingHorizontal: 6,
  }}>
    {children}
  </Text>
);

// ── TD — data cell ────────────────────────────────────────────────────────────

export const TD: React.FC<{ children: React.ReactNode; width: number; isDark: boolean }> = ({ children, width, isDark }) => (
  <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 6 }}>
    {typeof children === 'string' || typeof children === 'number'
      ? <Text style={{ fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', textAlign: 'center' }} numberOfLines={1}>{children}</Text>
      : children}
  </View>
);

// ── Row wrapper ───────────────────────────────────────────────────────────────

export const TableRow: React.FC<{ index: number; isDark: boolean; children: React.ReactNode }> = ({ index, isDark, children }) => (
  <View style={{
    flexDirection: 'row',
    backgroundColor: index % 2 === 0
      ? 'transparent'
      : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
  }}>
    {children}
  </View>
);

// ── Header row wrapper ────────────────────────────────────────────────────────

export const TableHeader: React.FC<{ isDark: boolean; children: React.ReactNode }> = ({ isDark, children }) => (
  <View style={{
    flexDirection: 'row',
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    borderBottomWidth: 1.5,
    borderBottomColor: isDark ? '#334155' : '#e2e8f0',
  }}>
    {children}
  </View>
);
