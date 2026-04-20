import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text,
  Platform, Dimensions, PixelRatio,
} from 'react-native';
import Constants from 'expo-constants';
import { useUiStore } from '../../stores/uiStore';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface InfoRow {
  label: string;
  value: string | number | boolean | null | undefined;
}

interface InfoSection {
  title: string;
  emoji: string;
  color: string;
  rows: InfoRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? '✅ Yes' : '❌ No';
  return String(v) || '—';
}

// ─────────────────────────────────────────────────────────────────────────────
// Section card
// ─────────────────────────────────────────────────────────────────────────────

const SectionCard: React.FC<{ section: InfoSection; isDark: boolean }> = ({ section, isDark }) => {
  const bg     = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const labelC = isDark ? '#94a3b8' : '#64748b';
  const valueC = isDark ? '#e2e8f0' : '#1e293b';
  const rowBg  = isDark ? '#273549' : '#f8fafc';

  return (
    <View style={{
      backgroundColor: bg, borderRadius: 14,
      borderWidth: 1, borderColor: border,
      marginBottom: 14, overflow: 'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: section.color + (isDark ? '22' : '12'),
        borderBottomWidth: 1, borderBottomColor: border,
      }}>
        <Text style={{ fontSize: 20 }}>{section.emoji}</Text>
        <Text style={{
          fontSize: 13, fontWeight: '800', color: section.color,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {section.title}
        </Text>
      </View>

      {/* Rows */}
      {section.rows.map((row, i) => (
        <View
          key={row.label}
          style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 11,
            backgroundColor: i % 2 === 0 ? 'transparent' : rowBg,
            borderBottomWidth: i < section.rows.length - 1 ? 1 : 0,
            borderBottomColor: border,
          }}
        >
          <Text style={{ flex: 1, fontSize: 12, color: labelC, fontWeight: '600' }}>
            {row.label}
          </Text>
          <Text style={{
            fontSize: 12, color: valueC, fontWeight: '500',
            textAlign: 'right', maxWidth: '58%', flexShrink: 1,
          }}>
            {fmt(row.value)}
          </Text>
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

const DeviceInfoScreen: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const [windowDims, setWindowDims] = useState(Dimensions.get('window'));
  const [screenDims, setScreenDims] = useState(Dimensions.get('screen'));

  // Update dimensions on rotation
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window, screen }) => {
      setWindowDims(window);
      setScreenDims(screen);
    });
    return () => sub.remove();
  }, []);

  const pixelRatio = PixelRatio.get();
  const fontScale  = PixelRatio.getFontScale();

  // Pull everything available from Constants + Platform
  const manifest  = Constants.expoConfig ?? {};
  const device    = (Constants as any).deviceName ?? '—';
  const platform  = Platform.OS;
  const osVersion = Platform.Version;

  // Android-specific
  const androidRelease = Platform.OS === 'android'
    ? (Platform as any).constants?.Release ?? '—'
    : null;
  const androidSdk = Platform.OS === 'android'
    ? (Platform as any).constants?.Version ?? '—'
    : null;
  const androidBoard = Platform.OS === 'android'
    ? (Platform as any).constants?.Board ?? '—'
    : null;
  const androidBrand = Platform.OS === 'android'
    ? (Platform as any).constants?.Brand ?? '—'
    : null;
  const androidManufacturer = Platform.OS === 'android'
    ? (Platform as any).constants?.Manufacturer ?? '—'
    : null;
  const androidModel = Platform.OS === 'android'
    ? (Platform as any).constants?.Model ?? '—'
    : null;
  const androidFingerprint = Platform.OS === 'android'
    ? (Platform as any).constants?.Fingerprint ?? '—'
    : null;

  // iOS-specific
  const iosModel = Platform.OS === 'ios'
    ? (Platform as any).constants?.Model ?? '—'
    : null;
  const iosSystemVersion = Platform.OS === 'ios'
    ? (Platform as any).constants?.osVersion ?? '—'
    : null;

  const sections: InfoSection[] = [
    {
      title: 'Device',
      emoji: '📱',
      color: '#6366f1',
      rows: [
        { label: 'Device Name',     value: device },
        { label: 'Platform',        value: platform.toUpperCase() },
        ...(platform === 'android' ? [
          { label: 'Brand',         value: androidBrand },
          { label: 'Manufacturer',  value: androidManufacturer },
          { label: 'Model',         value: androidModel },
          { label: 'Board',         value: androidBoard },
        ] : []),
        ...(platform === 'ios' ? [
          { label: 'Model',         value: iosModel },
        ] : []),
        { label: 'Is Emulator',     value: !Constants.isDevice },
      ],
    },
    {
      title: 'Operating System',
      emoji: '🖥️',
      color: '#0ea5e9',
      rows: [
        { label: 'OS',              value: platform === 'ios' ? 'iOS' : 'Android' },
        { label: 'OS Version',      value: String(osVersion) },
        ...(platform === 'android' ? [
          { label: 'Android Release', value: androidRelease },
          { label: 'SDK Level',       value: androidSdk },
          { label: 'Fingerprint',     value: androidFingerprint },
        ] : []),
        ...(platform === 'ios' ? [
          { label: 'System Version',  value: iosSystemVersion },
        ] : []),
      ],
    },
    {
      title: 'App',
      emoji: '📦',
      color: '#8b5cf6',
      rows: [
        { label: 'App Name',        value: manifest.name },
        { label: 'Version',         value: manifest.version },
        { label: 'Expo SDK',        value: manifest.sdkVersion },
        { label: 'Slug',            value: manifest.slug },
        { label: 'Scheme',          value: Array.isArray(manifest.scheme) ? manifest.scheme[0] : manifest.scheme },
        { label: 'Debug Mode',      value: __DEV__ },
        { label: 'Execution Env',   value: (Constants as any).executionEnvironment ?? '—' },
        { label: 'Session ID',      value: Constants.sessionId },
      ],
    },
    {
      title: 'Display',
      emoji: '🖼️',
      color: '#ec4899',
      rows: [
        { label: 'Window Width',    value: `${Math.round(windowDims.width)} dp` },
        { label: 'Window Height',   value: `${Math.round(windowDims.height)} dp` },
        { label: 'Screen Width',    value: `${Math.round(screenDims.width)} dp` },
        { label: 'Screen Height',   value: `${Math.round(screenDims.height)} dp` },
        { label: 'Pixel Ratio',     value: pixelRatio.toFixed(2) },
        { label: 'Font Scale',      value: fontScale.toFixed(2) },
        { label: 'Physical Pixels', value: `${Math.round(screenDims.width * pixelRatio)} × ${Math.round(screenDims.height * pixelRatio)} px` },
        { label: 'Scale',           value: screenDims.scale?.toFixed(2) ?? '—' },
      ],
    },
    {
      title: 'Runtime',
      emoji: '⚙️',
      color: '#f59e0b',
      rows: [
        { label: 'JS Engine',       value: (global as any).HermesInternal ? 'Hermes' : 'JSC' },
        { label: 'Architecture',    value: (global as any).__turboModuleProxy ? 'New (Fabric)' : 'Old (Paper)' },
        { label: 'Expo Go',         value: (Constants as any).executionEnvironment === 'storeClient' },
        { label: 'Status Bar H',    value: Constants.statusBarHeight ? `${Constants.statusBarHeight} dp` : '—' },
      ],
    },
  ];

  const bg = isDark ? '#0f172a' : '#f8fafc';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Page header */}
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
            {platform.toUpperCase()} · v{String(osVersion)}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((s) => (
          <SectionCard key={s.title} section={s} isDark={isDark} />
        ))}
      </ScrollView>
    </View>
  );
};

export default DeviceInfoScreen;
