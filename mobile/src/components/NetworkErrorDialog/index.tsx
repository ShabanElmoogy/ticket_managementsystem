import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { networkEvents } from '@/src/services/api/networkEvents';
import { useThemeColors, useIsDark, Radius, FontSize, FontWeight } from '@/src/constants/theme';
import { AlertDialog, PrimaryButton } from '@/src/shared/components';
import ErrorExtraBanner from './components/ErrorExtraBanner';
import SharePanel       from './components/SharePanel';
import ShareTrigger     from './components/ShareTrigger';
import { statusColor, statusIcon, statusLabel } from './utils';
import type { ErrorState } from './types';

const NetworkErrorDialog: React.FC = () => {
  const c      = useThemeColors();
  const isDark = useIsDark();

  const [visible,       setVisible]       = useState(false);
  const [retrying,      setRetrying]      = useState(false);
  const [error,         setError]         = useState<ErrorState | null>(null);
  const [shareExpanded, setShareExpanded] = useState(false);

  // ── dismiss ────────────────────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    setVisible(false);
    setRetrying(false);
    setError(null);
    setShareExpanded(false);
  }, []);

  // ── socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsubNetwork = networkEvents.onError((msg) => {
      setError((prev) => ({
        kind:      'network',
        title:     'Connection Error',
        subtitle:  'Network unavailable',
        message:   msg,
        count:     prev?.kind === 'network' ? prev.count + 1 : 1,
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
  const icon        = retrying ? '🔄'      : statusIcon(error?.status);

  // ── extra slot: banner + share panel ──────────────────────────────────────
  const extra = (
    <>
      <ErrorExtraBanner error={error} retrying={retrying} />

      {shareExpanded && error && !retrying && (
        <SharePanel
          error={error}
          accentColor={accentColor}
          icon={icon}
          onClose={() => setShareExpanded(false)}
        />
      )}
    </>
  );

  // ── actions override: Share (left) | OK + Cancel (right) — one row ────────
  const actionsOverride = error && !retrying ? (
    <View style={{ flexDirection: 'row', width: '100%', gap: 10, alignItems: 'stretch' }}>

      {/* Share — left */}
      <ShareTrigger
        onPress={() => setShareExpanded((v) => !v)}
      />

      {/* OK + Cancel — right side */}
      <View style={{ flex: 2, flexDirection: 'row', gap: 8 }}>

        {/* OK */}
        <PrimaryButton
          label="OK"
          icon="✓"
          color={accentColor}
          onPress={dismiss}
        />

        {/* Cancel */}
        <Pressable
          onPress={dismiss}
          style={({ pressed }) => ({
            flex:           1,
            flexDirection:  'row',
            alignItems:     'center',
            justifyContent: 'center',
            borderRadius:   Radius.xl,
            borderWidth:    1.5,
            borderColor:    c.border.secondary,
            backgroundColor: pressed ? c.interactive.pressed : 'transparent',
            minHeight:      58,
          })}
        >
          <Text style={{ fontSize: FontSize.lg, color: c.text.secondary, marginEnd: 6 }}>✕</Text>
          <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: c.text.secondary }}>
            Cancel
          </Text>
        </Pressable>

      </View>
    </View>
  ) : undefined;

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
      actionsOverride={actionsOverride}
    />
  );
};

export default NetworkErrorDialog;
