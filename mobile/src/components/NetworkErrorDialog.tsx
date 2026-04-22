import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { networkEvents } from '@/src/services/api/networkEvents';
import { useUiStore } from '@/src/stores/uiStore';
import { AlertDialog } from '@/src/shared/components';

// ── Error types ───────────────────────────────────────────────────────────────

type ErrorKind = 'network' | 'api';

interface ErrorState {
  kind:     ErrorKind;
  title:    string;
  subtitle: string;
  message:  string;
  status?:  number;
  details?: unknown;
  count:    number;
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(status: number): string {
  if (status >= 500) return 'Server Error';
  if (status === 403) return 'Access Denied';
  if (status === 422) return 'Validation Error';
  if (status === 429) return 'Too Many Requests';
  if (status === 408) return 'Request Timeout';
  return `Error ${status}`;
}

function statusColor(status?: number): string {
  if (!status) return '#ef4444';
  if (status >= 500) return '#dc2626';
  if (status === 403) return '#f59e0b';
  if (status === 429) return '#8b5cf6';
  return '#ef4444';
}

function statusIcon(status?: number): string {
  if (!status) return '📡';
  if (status >= 500) return '🔥';
  if (status === 403) return '🔒';
  if (status === 429) return '⏱️';
  if (status === 408) return '⏰';
  return '⚠️';
}

function buildShareText(error: ErrorState): string {
  const lines: string[] = [
    `🐛 Error Report — ${error.timestamp}`,
    `─────────────────────────────`,
    `Type:    ${error.kind === 'network' ? 'Network Error' : `API Error (HTTP ${error.status})`}`,
    `Title:   ${error.title}`,
    `Message: ${error.message}`,
  ];
  if (error.details) {
    lines.push('');
    lines.push('Details:');
    lines.push(
      typeof error.details === 'string'
        ? error.details
        : JSON.stringify(error.details, null, 2),
    );
  }
  return lines.join('\n');
}

// ── Screenshot card (what gets captured) ─────────────────────────────────────

interface ErrorCardProps {
  error: ErrorState;
  accentColor: string;
  icon: string;
  isDark: boolean;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ error, accentColor, icon, isDark }) => {
  const cardBg  = isDark ? '#1e293b' : '#ffffff';
  const textPri = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#64748b';
  const msgBg   = isDark ? '#0f172a' : '#f8fafc';
  const border  = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{
      backgroundColor: cardBg,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: border,
      minWidth: 300,
    }}>
      {/* Accent stripe */}
      <View style={{ height: 5, backgroundColor: accentColor }} />

      <View style={{ padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: accentColor + '18', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22 }}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: textPri }}>{error.title}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: accentColor }}>{error.subtitle}</Text>
          </View>
        </View>

        {/* Message */}
        <View style={{ backgroundColor: msgBg, borderRadius: 10, borderWidth: 1, borderColor: border, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: textSec, lineHeight: 20 }}>{error.message}</Text>
        </View>

        {/* Details (if any) */}
        {error.details && (
          <View style={{ backgroundColor: msgBg, borderRadius: 10, borderWidth: 1, borderColor: border, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: textSec, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Response Details
            </Text>
            <Text style={{ fontSize: 11, color: textSec, fontFamily: 'monospace' }} numberOfLines={6}>
              {typeof error.details === 'string'
                ? error.details
                : JSON.stringify(error.details, null, 2)}
            </Text>
          </View>
        )}

        {/* Timestamp */}
        <Text style={{ fontSize: 10, color: isDark ? '#475569' : '#cbd5e1', textAlign: 'right' }}>
          {error.timestamp}
        </Text>
      </View>
    </View>
  );
};

// ── Share button ──────────────────────────────────────────────────────────────

interface ShareButtonProps {
  error: ErrorState;
  accentColor: string;
  icon: string;
  isDark: boolean;
}

const ShareButton: React.FC<ShareButtonProps> = ({ error, accentColor, icon, isDark }) => {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Toast.show({ type: 'error', text1: 'Sharing not available on this device', position: 'bottom' });
        return;
      }

      // Capture the error card as an image
      const uri = await captureRef(cardRef, {
        format:  'png',
        quality: 1,
        result:  'tmpfile',
      });

      // Share both the image (screenshot) and the text
      await Sharing.shareAsync(uri, {
        mimeType:    'image/png',
        dialogTitle: 'Share Error Report',
        UTI:         'public.png',
      });
    } catch (e) {
      if (__DEV__) console.warn('Share failed:', e);
      Toast.show({ type: 'error', text1: 'Could not share error report', position: 'bottom' });
    } finally {
      setSharing(false);
    }
  };

  const btnBg     = isDark ? '#273549' : '#f1f5f9';
  const btnBorder = isDark ? '#334155' : '#e2e8f0';
  const btnText   = isDark ? '#e2e8f0' : '#374151';

  return (
    <View>
      {/* Hidden card rendered off-screen for capture */}
      <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <ViewShot ref={cardRef as any} options={{ format: 'png', quality: 1 }}>
          <View style={{ padding: 20, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
            <ErrorCard error={error} accentColor={accentColor} icon={icon} isDark={isDark} />
          </View>
        </ViewShot>
      </View>

      {/* Visible share button */}
      <Pressable
        onPress={handleShare}
        disabled={sharing}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          paddingVertical: 13,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          backgroundColor: pressed ? btnBorder : btnBg,
          borderWidth: 1,
          borderColor: btnBorder,
          opacity: sharing ? 0.6 : 1,
        })}
      >
        {sharing
          ? <ActivityIndicator size="small" color={btnText} />
          : <Text style={{ fontSize: 14 }}>📤</Text>
        }
        <Text style={{ fontSize: 14, fontWeight: '700', color: btnText }}>
          {sharing ? 'Sharing…' : 'Share'}
        </Text>
      </Pressable>
    </View>
  );
};

// ── Main dialog ───────────────────────────────────────────────────────────────

const NetworkErrorDialog: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const [visible,  setVisible]  = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error,    setError]    = useState<ErrorState | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    setRetrying(false);
    setError(null);
  }, []);

  useEffect(() => {
    const unsubNetwork = networkEvents.onError((msg) => {
      setError((prev) => ({
        kind:      'network',
        title:     'Connection Error',
        subtitle:  'Network unavailable',
        message:   msg,
        count:     prev?.kind === 'network' ? (prev.count + 1) : 1,
        timestamp: new Date().toLocaleString(),
      }));
      setRetrying(false);
      setVisible(true);
    });

    const unsubApi = networkEvents.onApiError((status, message, details) => {
      setError({
        kind:      'api',
        title:     statusLabel(status),
        subtitle:  `HTTP ${status}`,
        message,
        status,
        details,
        count:     1,
        timestamp: new Date().toLocaleString(),
      });
      setRetrying(false);
      setVisible(true);
    });

    const unsubSuccess = networkEvents.onRetrySuccess((savedCount) => {
      setRetrying(true);
      setTimeout(() => {
        dismiss();
        Toast.show({
          type:           'success',
          text1:          'Back online ✓',
          text2:          `${savedCount} pending request${savedCount > 1 ? 's' : ''} saved successfully`,
          visibilityTime: 3500,
          position:       'bottom',
        });
      }, 600);
    });

    return () => { unsubNetwork(); unsubApi(); unsubSuccess(); };
  }, [dismiss]);

  if (!error && !retrying) return null;

  const accentColor = retrying ? '#10b981' : statusColor(error?.status);
  const icon        = retrying ? '🔄' : statusIcon(error?.status);

  // ── Extra slot ────────────────────────────────────────────────────────────
  const extra = retrying ? (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: isDark ? '#0c2a1a' : '#f0fdf4',
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    }}>
      <Text style={{ fontSize: 14 }}>🔄</Text>
      <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '600' }}>
        Connection restored — saving your data…
      </Text>
    </View>
  ) : error?.kind === 'network' && error.count > 1 ? (
    <View style={{
      backgroundColor: isDark ? '#3b1515' : '#fef2f2',
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    }}>
      <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>
        {error.count} requests failed simultaneously
      </Text>
    </View>
  ) : error?.kind === 'api' && __DEV__ && error.details ? (
    <View style={{
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
      borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
    }}>
      <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8', fontWeight: '700', marginBottom: 4 }}>
        DEV — RESPONSE DETAILS
      </Text>
      <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', fontFamily: 'monospace' }} numberOfLines={4}>
        {typeof error.details === 'string'
          ? error.details
          : JSON.stringify(error.details, null, 2)}
      </Text>
    </View>
  ) : null;

  return (
    <AlertDialog
      visible={visible}
      onClose={dismiss}
      accentColor={accentColor}
      icon={icon}
      title={retrying ? 'Reconnecting…' : (error?.title ?? 'Error')}
      subtitle={retrying ? undefined : error?.subtitle}
      message={retrying ? undefined : (error?.message ?? 'An unexpected error occurred.')}
      copyable={__DEV__ && !retrying}
      extra={extra}
      actions={retrying ? [] : [
        // Share button — renders as a custom action slot
        ...(error ? [{
          label:   'Share',
          onPress: () => {}, // handled by ShareButton internally
          variant: 'secondary' as const,
          icon:    '📤',
        }] : []),
        { label: 'OK', onPress: dismiss, variant: 'primary' as const, icon: '✓' },
      ]}
      // Override the actions slot to inject the ShareButton
      actionsOverride={error && !retrying ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ShareButton
            error={error}
            accentColor={accentColor}
            icon={icon}
            isDark={isDark}
          />
          <Pressable
            onPress={dismiss}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? accentColor + 'cc' : accentColor,
            })}
          >
            <Text style={{ fontSize: 14, marginEnd: 4 }}>✓</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>OK</Text>
          </Pressable>
        </View>
      ) : undefined}
      isDark={isDark}
    />
  );
};

export default NetworkErrorDialog;
