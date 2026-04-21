import { useEffect, useState } from 'react';
import { Platform, Dimensions, PixelRatio } from 'react-native';
import Constants from 'expo-constants';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { Paths } from 'expo-file-system';
import * as Updates from 'expo-updates';
import type { InfoSection } from '../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return '—';
  const gb = bytes / 1_073_741_824;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / 1_048_576;
  return `${mb.toFixed(0)} MB`;
}

function storageBar(free: number | null, total: number | null): string {
  if (!free || !total) return '—';
  const used = total - free;
  const pct  = Math.round((used / total) * 100);
  return `${formatBytes(used)} used · ${formatBytes(free)} free (${pct}%)`;
}

function networkTypeLabel(type: Network.NetworkStateType | null): string {
  if (!type) return '—';
  const map: Partial<Record<Network.NetworkStateType, string>> = {
    [Network.NetworkStateType.WIFI]:      '📶 Wi-Fi',
    [Network.NetworkStateType.CELLULAR]:  '📡 Cellular',
    [Network.NetworkStateType.BLUETOOTH]: '🔵 Bluetooth',
    [Network.NetworkStateType.ETHERNET]:  '🔌 Ethernet',
    [Network.NetworkStateType.NONE]:      '🚫 None',
    [Network.NetworkStateType.UNKNOWN]:   '❓ Unknown',
  };
  return map[type] ?? '—';
}

function batteryStateLabel(s: Battery.BatteryState | null): string {
  if (s === null) return '—';
  const map: Record<Battery.BatteryState, string> = {
    [Battery.BatteryState.CHARGING]:  '⚡ Charging',
    [Battery.BatteryState.FULL]:      '🔋 Full',
    [Battery.BatteryState.UNPLUGGED]: '🔌 Unplugged',
    [Battery.BatteryState.UNKNOWN]:   '❓ Unknown',
  };
  return map[s] ?? '—';
}

function deviceTypeLabel(t: Device.DeviceType | null): string {
  if (t === null) return '—';
  const map: Record<Device.DeviceType, string> = {
    [Device.DeviceType.PHONE]:   '📱 Phone',
    [Device.DeviceType.TABLET]:  '📟 Tablet',
    [Device.DeviceType.DESKTOP]: '🖥️ Desktop',
    [Device.DeviceType.TV]:      '📺 TV',
    [Device.DeviceType.UNKNOWN]: '❓ Unknown',
  };
  return map[t] ?? '—';
}

// ─── hook ────────────────────────────────────────────────────────────────────

interface AsyncState {
  batteryLevel:    number | null;
  batteryState:    Battery.BatteryState | null;
  lowPowerMode:    boolean | null;
  networkState:    Network.NetworkState | null;
  ipAddress:       string | null;
  airplaneMode:    boolean | null;
}

export function useDeviceInfoSections(): InfoSection[] {
  const [windowDims, setWindowDims] = useState(Dimensions.get('window'));
  const [screenDims, setScreenDims] = useState(Dimensions.get('screen'));
  const [async, setAsync] = useState<AsyncState>({
    batteryLevel: null, batteryState: null, lowPowerMode: null,
    networkState: null, ipAddress: null,    airplaneMode: null,
  });

  // Dimensions
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window, screen }) => {
      setWindowDims(window);
      setScreenDims(screen);
    });
    return () => sub.remove();
  }, []);

  // All async APIs in one shot
  useEffect(() => {
    let levelSub: Battery.Subscription | null = null;
    let stateSub: Battery.Subscription | null = null;

    (async () => {
      const results = await Promise.allSettled([
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
        Battery.isLowPowerModeEnabledAsync(),
        Network.getNetworkStateAsync(),
        Network.getIpAddressAsync(),
        Platform.OS === 'android' ? Network.isAirplaneModeEnabledAsync() : Promise.resolve(null),
      ]);

      const val = <T>(r: PromiseSettledResult<T>): T | null =>
        r.status === 'fulfilled' ? r.value : null;

      setAsync({
        batteryLevel: val(results[0] as PromiseSettledResult<number>),
        batteryState: val(results[1] as PromiseSettledResult<Battery.BatteryState>),
        lowPowerMode: val(results[2] as PromiseSettledResult<boolean>),
        networkState: val(results[3] as PromiseSettledResult<Network.NetworkState>),
        ipAddress:    val(results[4] as PromiseSettledResult<string>),
        airplaneMode: val(results[5] as PromiseSettledResult<boolean>),
      });

      // Live battery listeners
      try {
        levelSub = Battery.addBatteryLevelListener(({ batteryLevel: l }) =>
          setAsync((prev) => ({ ...prev, batteryLevel: l })));
        stateSub = Battery.addBatteryStateListener(({ batteryState: s }) =>
          setAsync((prev) => ({ ...prev, batteryState: s })));
      } catch { /* not available */ }
    })();

    return () => {
      levelSub?.remove();
      stateSub?.remove();
    };
  }, []);

  // ── derived values ──────────────────────────────────────────────────────────

  const pixelRatio = PixelRatio.get();
  const fontScale  = PixelRatio.getFontScale();
  const manifest   = Constants.expoConfig ?? ({} as NonNullable<typeof Constants.expoConfig>);
  const platform   = Platform.OS;
  const osVersion  = Platform.Version;
  const isAndroid  = platform === 'android';
  const isIos      = platform === 'ios';
  const androidC   = isAndroid ? (Platform as any).constants ?? {} : {};
  const iosC       = isIos     ? (Platform as any).constants ?? {} : {};

  const { batteryLevel, batteryState, lowPowerMode,
          networkState, ipAddress, airplaneMode } = async;

  // Storage — sync properties from Paths
  let freeDisk: number | null = null;
  let totalDisk: number | null = null;
  try {
    freeDisk  = Paths.availableDiskSpace;
    totalDisk = Paths.totalDiskSpace;
  } catch { /* not available on this platform */ }

  const batteryPercent = batteryLevel !== null && batteryLevel >= 0
    ? `${Math.round(batteryLevel * 100)}%` : '—';

  const batteryEmoji = batteryLevel === null || batteryLevel < 0 ? '🔋'
    : batteryLevel > 0.8 ? '🔋'
    : batteryLevel > 0.4 ? '🪫' : '⚠️';

  const cpuArch = Device.supportedCpuArchitectures?.join(', ') ?? '—';

  // Updates
  const updatedAt = Updates.createdAt
    ? Updates.createdAt.toLocaleString() : '—';

  // ── sections ────────────────────────────────────────────────────────────────

  const sections: InfoSection[] = [
    {
      title: 'Device',
      emoji: '📱',
      color: '#6366f1',
      rows: [
        { label: 'Device Name',    value: Device.deviceName ?? (Constants as any).deviceName ?? '—' },
        { label: 'Type',           value: deviceTypeLabel(Device.deviceType) },
        { label: 'Brand',          value: Device.brand ?? androidC.Brand ?? '—' },
        { label: 'Manufacturer',   value: Device.manufacturer ?? androidC.Manufacturer ?? '—' },
        { label: 'Model Name',     value: Device.modelName ?? androidC.Model ?? iosC.Model ?? '—' },
        { label: 'Model ID',       value: Device.modelId ?? '—' },
        { label: 'Design Name',    value: (Device as any).designName ?? '—' },
        { label: 'Year Class',     value: Device.deviceYearClass ?? '—' },
        { label: 'Total RAM',      value: formatBytes(Device.totalMemory) },
        { label: 'CPU Arch',       value: cpuArch },
        { label: 'Is Emulator',    value: !Device.isDevice },
      ],
    },
    {
      title: 'Operating System',
      emoji: '🖥️',
      color: '#0ea5e9',
      rows: [
        { label: 'OS Name',        value: Device.osName ?? (isIos ? 'iOS' : 'Android') },
        { label: 'OS Version',     value: Device.osVersion ?? String(osVersion) },
        { label: 'OS Build ID',    value: Device.osBuildId ?? '—' },
        { label: 'Internal Build', value: Device.osBuildFingerprint ?? androidC.Fingerprint ?? '—' },
        ...(isAndroid ? [
          { label: 'Android Release', value: androidC.Release ?? '—' },
          { label: 'SDK Level',        value: androidC.Version ?? '—' },
        ] : []),
        ...(isIos ? [
          { label: 'System Version',   value: iosC.osVersion ?? '—' },
        ] : []),
      ],
    },
    {
      title: batteryEmoji + ' Battery',
      emoji: batteryEmoji,
      color: '#22c55e',
      rows: [
        { label: 'Level',          value: batteryPercent },
        { label: 'State',          value: batteryStateLabel(batteryState) },
        { label: 'Low Power Mode', value: lowPowerMode },
      ],
    },
    {
      title: 'Network',
      emoji: '🌐',
      color: '#06b6d4',
      rows: [
        { label: 'Type',           value: networkTypeLabel(networkState?.type ?? null) },
        { label: 'Connected',      value: networkState?.isConnected ?? null },
        { label: 'Internet',       value: networkState?.isInternetReachable ?? null },
        { label: 'IP Address',     value: ipAddress },
        ...(Platform.OS === 'android' ? [
          { label: 'Airplane Mode', value: airplaneMode },
        ] : []),
      ],
    },
    {
      title: 'Storage',
      emoji: '💾',
      color: '#f97316',
      rows: [
        { label: 'Total',          value: formatBytes(totalDisk) },
        { label: 'Free',           value: formatBytes(freeDisk) },
        { label: 'Usage',          value: storageBar(freeDisk, totalDisk) },
      ],
    },
    {
      title: 'App',
      emoji: '📦',
      color: '#8b5cf6',
      rows: [
        { label: 'App Name',       value: manifest.name },
        { label: 'Version',        value: manifest.version },
        { label: 'Expo SDK',       value: manifest.sdkVersion },
        { label: 'Slug',           value: manifest.slug },
        { label: 'Scheme',         value: Array.isArray(manifest.scheme) ? manifest.scheme[0] : manifest.scheme },
        { label: 'Debug Mode',     value: __DEV__ },
        { label: 'Execution Env',  value: (Constants as any).executionEnvironment ?? '—' },
        { label: 'Session ID',     value: Constants.sessionId },
      ],
    },
    {
      title: 'Updates',
      emoji: '🔄',
      color: '#14b8a6',
      rows: [
        { label: 'Update ID',      value: Updates.updateId ?? '—' },
        { label: 'Channel',        value: Updates.channel ?? '—' },
        { label: 'Runtime Version', value: Updates.runtimeVersion ?? '—' },
        { label: 'Embedded Launch', value: Updates.isEmbeddedLaunch },
        { label: 'Published At',   value: updatedAt },
      ],
    },
    {
      title: 'Display',
      emoji: '🖼️',
      color: '#ec4899',
      rows: [
        { label: 'Window Width',   value: `${Math.round(windowDims.width)} dp` },
        { label: 'Window Height',  value: `${Math.round(windowDims.height)} dp` },
        { label: 'Screen Width',   value: `${Math.round(screenDims.width)} dp` },
        { label: 'Screen Height',  value: `${Math.round(screenDims.height)} dp` },
        { label: 'Pixel Ratio',    value: pixelRatio.toFixed(2) },
        { label: 'Font Scale',     value: fontScale.toFixed(2) },
        { label: 'Physical Pixels', value: `${Math.round(screenDims.width * pixelRatio)} × ${Math.round(screenDims.height * pixelRatio)} px` },
        { label: 'Scale',          value: screenDims.scale?.toFixed(2) ?? '—' },
      ],
    },
    {
      title: 'Runtime',
      emoji: '⚙️',
      color: '#f59e0b',
      rows: [
        { label: 'JS Engine',      value: (global as any).HermesInternal ? 'Hermes' : 'JSC' },
        { label: 'Architecture',   value: (global as any).__turboModuleProxy ? 'New (Fabric)' : 'Old (Paper)' },
        { label: 'Expo Go',        value: (Constants as any).executionEnvironment === 'storeClient' },
        { label: 'Status Bar H',   value: Constants.statusBarHeight ? `${Constants.statusBarHeight} dp` : '—' },
      ],
    },
  ];

  return sections;
}
