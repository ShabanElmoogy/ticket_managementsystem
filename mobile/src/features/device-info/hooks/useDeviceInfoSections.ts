import { useEffect, useState } from 'react';
import { Platform, Dimensions, PixelRatio } from 'react-native';
import { useTranslation } from 'react-i18next';
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

function storageBar(free: number | null, total: number | null, tUsed: string, tFree: string): string {
  if (!free || !total) return '—';
  const used = total - free;
  const pct  = Math.round((used / total) * 100);
  return `${formatBytes(used)} ${tUsed} · ${formatBytes(free)} ${tFree} (${pct}%)`;
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
  const { t } = useTranslation();
  const l = (key: string) => t(`deviceInfo.labels.${key}`);
  const s = (key: string) => t(`deviceInfo.sections.${key}`);
  const v = (key: string) => t(`deviceInfo.values.${key}`);

  const networkTypeLabel = (type: Network.NetworkStateType | null): string => {
    if (!type) return '—';
    const map: Partial<Record<Network.NetworkStateType, string>> = {
      [Network.NetworkStateType.WIFI]:      `📶 ${v('wifi')}`,
      [Network.NetworkStateType.CELLULAR]:  `📡 ${v('cellular')}`,
      [Network.NetworkStateType.BLUETOOTH]: `🔵 ${v('bluetooth')}`,
      [Network.NetworkStateType.ETHERNET]:  `🔌 ${v('ethernet')}`,
      [Network.NetworkStateType.NONE]:      `🚫 ${v('none')}`,
      [Network.NetworkStateType.UNKNOWN]:   `❓ ${v('unknown')}`,
    };
    return map[type] ?? '—';
  };

  const batteryStateLabel = (bs: Battery.BatteryState | null): string => {
    if (bs === null) return '—';
    const map: Record<Battery.BatteryState, string> = {
      [Battery.BatteryState.CHARGING]:  `⚡ ${v('charging')}`,
      [Battery.BatteryState.FULL]:      `🔋 ${v('full')}`,
      [Battery.BatteryState.UNPLUGGED]: `🔌 ${v('unplugged')}`,
      [Battery.BatteryState.UNKNOWN]:   `❓ ${v('unknown')}`,
    };
    return map[bs] ?? '—';
  };

  const deviceTypeLabel = (dt: Device.DeviceType | null): string => {
    if (dt === null) return '—';
    const map: Record<Device.DeviceType, string> = {
      [Device.DeviceType.PHONE]:   `📱 ${v('phone')}`,
      [Device.DeviceType.TABLET]:  `📟 ${v('tablet')}`,
      [Device.DeviceType.DESKTOP]: `🖥️ ${v('desktop')}`,
      [Device.DeviceType.TV]:      `📺 ${v('tv')}`,
      [Device.DeviceType.UNKNOWN]: `❓ ${v('unknown')}`,
    };
    return map[dt] ?? '—';
  };
  const [windowDims, setWindowDims] = useState(Dimensions.get('window'));
  const [screenDims, setScreenDims] = useState(Dimensions.get('screen'));
  const [storageRefresh, setStorageRefresh] = useState(0); // trigger re-read
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

  // Storage — re-read every 30s (Paths properties are sync, no native listener)
  useEffect(() => {
    const timer = setInterval(() => setStorageRefresh((n) => n + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  // All async APIs in one shot + all real-time listeners
  useEffect(() => {
    let levelSub:   ReturnType<typeof Battery.addBatteryLevelListener>   | null = null;
    let stateSub:   ReturnType<typeof Battery.addBatteryStateListener>   | null = null;
    let powerSub:   ReturnType<typeof Battery.addLowPowerModeListener>   | null = null;
    let networkSub: ReturnType<typeof Network.addNetworkStateListener>   | null = null;

    // Helper to re-fetch IP address (called on mount + on network change)
    const refreshIp = async () => {
      try {
        const ip = await Network.getIpAddressAsync();
        setAsync((prev) => ({ ...prev, ipAddress: ip }));
      } catch { /* ignore */ }
    };

    // Helper to re-fetch airplane mode (Android only)
    const refreshAirplaneMode = async () => {
      if (Platform.OS !== 'android') return;
      try {
        const mode = await Network.isAirplaneModeEnabledAsync();
        setAsync((prev) => ({ ...prev, airplaneMode: mode }));
      } catch { /* ignore */ }
    };

    (async () => {
      // ── Initial load ──────────────────────────────────────────────────────
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

      // ── Battery listeners ─────────────────────────────────────────────────
      try {
        levelSub = Battery.addBatteryLevelListener(({ batteryLevel: l }) =>
          setAsync((prev) => ({ ...prev, batteryLevel: l })));

        stateSub = Battery.addBatteryStateListener(({ batteryState: s }) =>
          setAsync((prev) => ({ ...prev, batteryState: s })));

        powerSub = Battery.addLowPowerModeListener(({ lowPowerMode: lp }) =>
          setAsync((prev) => ({ ...prev, lowPowerMode: lp })));
      } catch { /* battery API not available on this platform */ }

      // ── Network listener ──────────────────────────────────────────────────
      try {
        networkSub = Network.addNetworkStateListener((state) => {
          setAsync((prev) => ({ ...prev, networkState: state }));
          // Re-fetch IP and airplane mode whenever connectivity changes
          refreshIp();
          refreshAirplaneMode();
        });
      } catch { /* network listener not available */ }
    })();

    return () => {
      levelSub?.remove();
      stateSub?.remove();
      powerSub?.remove();
      networkSub?.remove();
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

  // Storage — sync properties from Paths, re-reads on storageRefresh tick
  // eslint-disable-next-line react-hooks/exhaustive-deps
  let freeDisk: number | null = null;
  let totalDisk: number | null = null;
  try {
    void storageRefresh; // declare dependency
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
      title: s('device'),
      emoji: '📱',
      color: '#6366f1',
      rows: [
        { label: l('deviceName'),    value: Device.deviceName ?? (Constants as any).deviceName ?? '—' },
        { label: l('type'),          value: deviceTypeLabel(Device.deviceType) },
        { label: l('brand'),         value: Device.brand ?? androidC.Brand ?? '—' },
        { label: l('manufacturer'),  value: Device.manufacturer ?? androidC.Manufacturer ?? '—' },
        { label: l('modelName'),     value: Device.modelName ?? androidC.Model ?? iosC.Model ?? '—' },
        { label: l('modelId'),       value: Device.modelId ?? '—' },
        { label: l('designName'),    value: (Device as any).designName ?? '—' },
        { label: l('yearClass'),     value: Device.deviceYearClass ?? '—' },
        { label: l('totalRam'),      value: formatBytes(Device.totalMemory) },
        { label: l('cpuArch'),       value: cpuArch },
        { label: l('isEmulator'),    value: !Device.isDevice },
      ],
    },
    {
      title: s('os'),
      emoji: '🖥️',
      color: '#0ea5e9',
      rows: [
        { label: l('osName'),        value: Device.osName ?? (isIos ? 'iOS' : 'Android') },
        { label: l('osVersion'),     value: Device.osVersion ?? String(osVersion) },
        { label: l('osBuildId'),     value: Device.osBuildId ?? '—' },
        { label: l('internalBuild'), value: Device.osBuildFingerprint ?? androidC.Fingerprint ?? '—' },
        ...(isAndroid ? [
          { label: l('androidRelease'), value: androidC.Release ?? '—' },
          { label: l('sdkLevel'),       value: androidC.Version ?? '—' },
        ] : []),
        ...(isIos ? [
          { label: l('systemVersion'),  value: iosC.osVersion ?? '—' },
        ] : []),
      ],
    },
    {
      title: `${batteryEmoji} ${s('battery')}`,
      emoji: batteryEmoji,
      color: '#22c55e',
      rows: [
        { label: l('level'),         value: batteryPercent },
        { label: l('state'),         value: batteryStateLabel(batteryState) },
        { label: l('lowPowerMode'),  value: lowPowerMode },
      ],
    },
    {
      title: s('network'),
      emoji: '🌐',
      color: '#06b6d4',
      rows: [
        { label: l('networkType'),   value: networkTypeLabel(networkState?.type ?? null) },
        { label: l('connected'),     value: networkState?.isConnected ?? null },
        { label: l('internet'),      value: networkState?.isInternetReachable ?? null },
        { label: l('ipAddress'),     value: ipAddress },
        ...(Platform.OS === 'android' ? [
          { label: l('airplaneMode'), value: airplaneMode },
        ] : []),
      ],
    },
    {
      title: s('storage'),
      emoji: '💾',
      color: '#f97316',
      rows: [
        { label: l('total'),         value: formatBytes(totalDisk) },
        { label: l('free'),          value: formatBytes(freeDisk) },
        { label: l('usage'),         value: storageBar(freeDisk, totalDisk, v('used'), v('free')) },
      ],
    },
    {
      title: s('app'),
      emoji: '📦',
      color: '#8b5cf6',
      rows: [
        { label: l('appName'),       value: manifest.name },
        { label: l('version'),       value: manifest.version },
        { label: l('expoSdk'),       value: manifest.sdkVersion },
        { label: l('slug'),          value: manifest.slug },
        { label: l('scheme'),        value: Array.isArray(manifest.scheme) ? manifest.scheme[0] : manifest.scheme },
        { label: l('debugMode'),     value: __DEV__ },
        { label: l('executionEnv'),  value: (Constants as any).executionEnvironment ?? '—' },
        { label: l('sessionId'),     value: Constants.sessionId },
      ],
    },
    {
      title: s('updates'),
      emoji: '🔄',
      color: '#14b8a6',
      rows: [
        { label: l('updateId'),        value: Updates.updateId ?? '—' },
        { label: l('channel'),         value: Updates.channel ?? '—' },
        { label: l('runtimeVersion'),  value: Updates.runtimeVersion ?? '—' },
        { label: l('embeddedLaunch'),  value: Updates.isEmbeddedLaunch },
        { label: l('publishedAt'),     value: updatedAt },
      ],
    },
    {
      title: s('display'),
      emoji: '🖼️',
      color: '#ec4899',
      rows: [
        { label: l('windowWidth'),    value: `${Math.round(windowDims.width)} dp` },
        { label: l('windowHeight'),   value: `${Math.round(windowDims.height)} dp` },
        { label: l('screenWidth'),    value: `${Math.round(screenDims.width)} dp` },
        { label: l('screenHeight'),   value: `${Math.round(screenDims.height)} dp` },
        { label: l('pixelRatio'),     value: pixelRatio.toFixed(2) },
        { label: l('fontScale'),      value: fontScale.toFixed(2) },
        { label: l('physicalPixels'), value: `${Math.round(screenDims.width * pixelRatio)} × ${Math.round(screenDims.height * pixelRatio)} px` },
        { label: l('scale'),          value: screenDims.scale?.toFixed(2) ?? '—' },
      ],
    },
    {
      title: s('runtime'),
      emoji: '⚙️',
      color: '#f59e0b',
      rows: [
        { label: l('jsEngine'),       value: (global as any).HermesInternal ? 'Hermes' : 'JSC' },
        { label: l('architecture'),   value: (global as any).__turboModuleProxy ? 'New (Fabric)' : 'Old (Paper)' },
        { label: l('expoGo'),         value: (Constants as any).executionEnvironment === 'storeClient' },
        { label: l('statusBarHeight'), value: Constants.statusBarHeight ? `${Constants.statusBarHeight} dp` : '—' },
      ],
    },
  ];

  return sections;
}
