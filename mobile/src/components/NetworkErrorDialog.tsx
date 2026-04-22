import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Linking } from 'react-native';
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

function darken(hex: string): string {
  const map: Record<string, string> = {
    '#ef4444': '#dc2626', '#dc2626': '#b91c1c',
    '#3b82f6': '#2563eb', '#f59e0b': '#d97706',
    '#10b981': '#059669', '#8b5cf6': '#7c3aed',
  };
  return map[hex] ?? hex;
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

// WhatsApp sharing helper
async function shareToWhatsApp(phoneNumber: string, message: string): Promise<void> {
  try {
    // Format phone number (remove any non-digits and ensure it starts with country code)
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
    
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      throw new Error('WhatsApp not installed');
    }
  } catch (error) {
    throw new Error('Failed to open WhatsApp');
  }
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
        {!!error.details && (
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

// ── Share panel ───────────────────────────────────────────────────────────────

// WhatsApp brand colours
const WA_GREEN      = '#25D366';
const WA_GREEN_DARK = '#128C7E';

interface SharePanelProps {
  error:       ErrorState;
  accentColor: string;
  icon:        string;
  isDark:      boolean;
  onClose:     () => void;
}

const SharePanel: React.FC<SharePanelProps> = ({ error, accentColor, icon, isDark, onClose }) => {
  const cardRef = useRef<View>(null);
  const [sharingWA,  setSharingWA]  = useState(false);
  const [sharingImg, setSharingImg] = useState(false);

  const SUPPORT_WHATSAPP_NUMBER = '+201284555561';

  const handleWhatsAppShare = async () => {
    if (sharingWA || sharingImg) return;
    setSharingWA(true);
    try {
      await shareToWhatsApp(SUPPORT_WHATSAPP_NUMBER, buildShareText(error));
      Toast.show({ type: 'success', text1: 'WhatsApp opened ✓', text2: 'Error report ready to send', position: 'bottom' });
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open WhatsApp', text2: 'Make sure WhatsApp is installed', position: 'bottom' });
    } finally {
      setSharingWA(false);
    }
  };

  const handleImageShare = async () => {
    if (sharingWA || sharingImg) return;
    setSharingImg(true);
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Toast.show({ type: 'error', text1: 'Sharing not available on this device', position: 'bottom' });
        return;
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Error Report', UTI: 'public.png' });
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not share screenshot', position: 'bottom' });
    } finally {
      setSharingImg(false);
    }
  };

  // theme
  const surface   = isDark ? '#1e293b' : '#ffffff';
  const surfaceHi = isDark ? '#273549' : '#f8fafc';
  const border    = isDark ? '#334155' : '#e2e8f0';
  const textPri   = isDark ? '#f1f5f9' : '#0f172a';
  const textSec   = isDark ? '#94a3b8' : '#64748b';
  const busy      = sharingWA || sharingImg;

  return (
    <View>
      {/* Off-screen capture target */}
      <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <ViewShot ref={cardRef as any} options={{ format: 'png', quality: 1 }}>
          <View style={{ padding: 20, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
            <ErrorCard error={error} accentColor={accentColor} icon={icon} isDark={isDark} />
          </View>
        </ViewShot>
      </View>

      {/* Panel */}
      <View style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: surface,
        overflow: 'hidden',
        marginBottom: 4,
      }}>

        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: surfaceHi,
          borderBottomWidth: 1,
          borderBottomColor: border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13 }}>📤</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: textPri, letterSpacing: 0.2 }}>
              Share Error Report
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: pressed ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#1e293b' : '#f1f5f9'),
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: textSec }}>✕</Text>
          </Pressable>
        </View>

        {/* WhatsApp row */}
        <Pressable
          onPress={handleWhatsAppShare}
          disabled={busy}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 13,
            backgroundColor: pressed ? (isDark ? '#0d2b1a' : '#f0fdf4') : 'transparent',
            opacity: busy ? 0.55 : 1,
          })}
        >
          {/* Green circle */}
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: WA_GREEN,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: WA_GREEN, shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4, shadowRadius: 5, elevation: 3,
          }}>
            {sharingWA
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ fontSize: 19 }}>💬</Text>
            }
          </View>

          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textPri }}>
              {sharingWA ? 'Opening WhatsApp…' : 'Send to Support'}
            </Text>
            <Text style={{ fontSize: 11, color: textSec, marginTop: 1 }}>
              {SUPPORT_WHATSAPP_NUMBER}
            </Text>
          </View>

          {/* Badge */}
          {!sharingWA && (
            <View style={{
              paddingHorizontal: 7, paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: WA_GREEN + '20',
              borderWidth: 1, borderColor: WA_GREEN + '50',
            }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: WA_GREEN_DARK, letterSpacing: 0.3 }}>
                WhatsApp
              </Text>
            </View>
          )}
        </Pressable>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: border, marginHorizontal: 14 }} />

        {/* Screenshot row */}
        <Pressable
          onPress={handleImageShare}
          disabled={busy}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 14,
            paddingVertical: 13,
            backgroundColor: pressed ? surfaceHi : 'transparent',
            opacity: busy ? 0.55 : 1,
          })}
        >
          {/* Grey circle */}
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: isDark ? '#334155' : '#e2e8f0',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {sharingImg
              ? <ActivityIndicator size="small" color={textSec} />
              : <Text style={{ fontSize: 19 }}>🖼️</Text>
            }
          </View>

          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textPri }}>
              {sharingImg ? 'Capturing…' : 'Share Screenshot'}
            </Text>
            <Text style={{ fontSize: 11, color: textSec, marginTop: 1 }}>
              Save or send to any app
            </Text>
          </View>

          <Text style={{ fontSize: 18, color: textSec }}>›</Text>
        </Pressable>

      </View>
    </View>
  );
};

// ── Share trigger button (collapsed state) ────────────────────────────────────

interface ShareTriggerProps {
  isDark:     boolean;
  onPress:    () => void;
}

const ShareTrigger: React.FC<ShareTriggerProps> = ({ isDark, onPress }) => {
  const surface   = isDark ? '#1e293b' : '#ffffff';
  const surfaceHi = isDark ? '#273549' : '#f8fafc';
  const border    = isDark ? '#475569' : '#d1d5db';
  const textPri   = isDark ? '#cbd5e1' : '#374151';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 18,
        minHeight: 58,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: border,
        backgroundColor: pressed ? surfaceHi : surface,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Text style={{ fontSize: 18 }}>📤</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: textPri, letterSpacing: 0.2 }}>
        Share
      </Text>
    </Pressable>
  );
};

// ── Main dialog ───────────────────────────────────────────────────────────────

const NetworkErrorDialog: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const [visible,       setVisible]       = useState(false);
  const [retrying,      setRetrying]      = useState(false);
  const [error,         setError]         = useState<ErrorState | null>(null);
  const [shareExpanded, setShareExpanded] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    setRetrying(false);
    setError(null);
    setShareExpanded(false);
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
      setShareExpanded(false);
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
      setShareExpanded(false);
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

  // ── Extra slot — stacks: info banner + share panel (when open) ────────────
  const extra = (
    <>
      {/* Info banners */}
      {retrying ? (
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
      ) : error?.kind === 'network' && error.count > 1 ? (
        <View style={{
          backgroundColor: isDark ? '#3b1515' : '#fef2f2',
          borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
          marginBottom: 4,
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
          marginBottom: 4,
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
      ) : null}

      {/* Share panel — only when expanded */}
      {shareExpanded && error && !retrying && (
        <SharePanel
          error={error}
          accentColor={accentColor}
          icon={icon}
          isDark={isDark}
          onClose={() => setShareExpanded(false)}
        />
      )}
    </>
  );

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
      actions={retrying ? [] : undefined}
      actionsOverride={error && !retrying ? (
        // actionsOverride is rendered inside a flexDirection:'row' View in AlertDialog
        <>
          {/* Share trigger — toggles the panel in extra slot */}
          <ShareTrigger
            isDark={isDark}
            onPress={() => setShareExpanded((v) => !v)}
          />
          {/* OK */}
          <Pressable
            onPress={dismiss}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minHeight: 58,
              backgroundColor: pressed ? darken(accentColor) : accentColor,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: pressed ? 1 : 4 },
              shadowOpacity: pressed ? 0.1 : 0.35,
              shadowRadius: pressed ? 2 : 8,
              elevation: pressed ? 1 : 4,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Text style={{ fontSize: 18 }}>✓</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.3 }}>OK</Text>
          </Pressable>
        </>
      ) : undefined}
      isDark={isDark}
    />
  );
};

export default NetworkErrorDialog;
