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
  const [showOptions, setShowOptions] = useState(false);

  // Configuration - you can modify this phone number
  const SUPPORT_WHATSAPP_NUMBER = '+201284555561'; // Replace with your support WhatsApp number

  const handleGeneralShare = async () => {
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
      setShowOptions(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const shareText = buildShareText(error);
      await shareToWhatsApp(SUPPORT_WHATSAPP_NUMBER, shareText);
      Toast.show({ 
        type: 'success', 
        text1: 'Opened WhatsApp', 
        text2: 'Error report ready to send',
        position: 'bottom' 
      });
    } catch (e) {
      if (__DEV__) console.warn('WhatsApp share failed:', e);
      Toast.show({ 
        type: 'error', 
        text1: 'Could not open WhatsApp', 
        text2: 'Make sure WhatsApp is installed',
        position: 'bottom' 
      });
    } finally {
      setSharing(false);
      setShowOptions(false);
    }
  };

  const toggleOptions = () => {
    if (sharing) return;
    setShowOptions(!showOptions);
  };

  if (showOptions) {
    return (
      <View style={{ flex: 1 }}>
        {/* Hidden card rendered off-screen for capture */}
        <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
          <ViewShot ref={cardRef as any} options={{ format: 'png', quality: 1 }}>
            <View style={{ padding: 20, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <ErrorCard error={error} accentColor={accentColor} icon={icon} isDark={isDark} />
            </View>
          </ViewShot>
        </View>

        {/* Share options */}
        <View style={{ gap: 8 }}>
          {/* WhatsApp option */}
          <Pressable
            onPress={handleWhatsAppShare}
            disabled={sharing}
            style={({ pressed }) => ({
              flexDirection: 'row',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              alignItems: 'center',
              gap: 12,
              backgroundColor: pressed
                ? '#25D366'
                : (isDark ? '#1e293b' : '#ffffff'),
              borderWidth: 1.5,
              borderColor: '#25D366',
              opacity: sharing ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 16 }}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#cbd5e1' : '#374151' }}>
                Send to Support
              </Text>
              <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                WhatsApp: {SUPPORT_WHATSAPP_NUMBER}
              </Text>
            </View>
          </Pressable>

          {/* General share option */}
          <Pressable
            onPress={handleGeneralShare}
            disabled={sharing}
            style={({ pressed }) => ({
              flexDirection: 'row',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              alignItems: 'center',
              gap: 12,
              backgroundColor: pressed
                ? (isDark ? '#334155' : '#e2e8f0')
                : (isDark ? '#1e293b' : '#ffffff'),
              borderWidth: 1.5,
              borderColor: isDark ? '#475569' : '#d1d5db',
              opacity: sharing ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 16 }}>📤</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#cbd5e1' : '#374151' }}>
                Share Screenshot
              </Text>
              <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
                Save or share to other apps
              </Text>
            </View>
          </Pressable>

          {/* Back button */}
          <Pressable
            onPress={() => setShowOptions(false)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              paddingVertical: 8,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 14 }}>←</Text>
            <Text style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }}>Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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

      {/* Main share button */}
      <Pressable
        onPress={toggleOptions}
        disabled={sharing}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row',
          paddingVertical: 18,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 58,
          backgroundColor: pressed
            ? (isDark ? '#334155' : '#e2e8f0')
            : (isDark ? '#1e293b' : '#ffffff'),
          borderWidth: 1.5,
          borderColor: isDark ? '#475569' : '#d1d5db',
          opacity: sharing ? 0.6 : 1,
        })}
      >
        {sharing
          ? <ActivityIndicator size="small" color={isDark ? '#cbd5e1' : '#374151'} />
          : <Text style={{ fontSize: 18 }}>📤</Text>
        }
        <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#cbd5e1' : '#374151' }}>
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
        <View style={{ flexDirection: 'row', gap: 25, flex: 1, justifyContent: 'flex-end' }}>
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
        </View>
      ) : undefined}
      isDark={isDark}
    />
  );
};

export default NetworkErrorDialog;
