import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { networkEvents } from '@/src/services/api/networkEvents';
import { useUiStore } from '@/src/stores/uiStore';
import { AlertDialog } from '@/src/shared/components';

const NetworkErrorDialog: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [count,   setCount]   = useState(0);
  const [retrying, setRetrying] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    setCount(0);
    setRetrying(false);
  }, []);

  useEffect(() => {
    // Show dialog on network error
    const unsubError = networkEvents.onError((msg) => {
      setMessage(msg);
      setCount((c) => c + 1);
      setRetrying(false);
      setVisible(true);
    });

    // When network returns and queued requests succeed:
    // 1. Show "retrying…" state briefly
    // 2. Dismiss the dialog
    // 3. Show success toast
    const unsubSuccess = networkEvents.onRetrySuccess((savedCount) => {
      setRetrying(true);

      // Small delay so user sees the "retrying" state before dismiss
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

    return () => {
      unsubError();
      unsubSuccess();
    };
  }, [dismiss]);

  const isDev = __DEV__;

  const displayMessage = isDev
    ? (message || 'Unable to reach the server. Please check your internet connection and try again.')
    : 'Unable to reach the server. Please check your internet connection and try again.';

  const countBadge = isDev && count > 1 ? (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: isDark ? '#3b1515' : '#fef2f2',
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    }}>
      <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>
        {count} requests failed simultaneously
      </Text>
    </View>
  ) : null;

  // Retrying state — show a different message while requests are being replayed
  const retryingBadge = retrying ? (
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
  ) : null;

  return (
    <AlertDialog
      visible={visible}
      onClose={dismiss}
      accentColor={retrying ? '#10b981' : '#ef4444'}
      icon={retrying ? '🔄' : '📡'}
      title={retrying ? 'Reconnecting…' : 'Connection Error'}
      subtitle={isDev && !retrying ? 'Network unavailable' : undefined}
      message={retrying ? undefined : displayMessage}
      copyable={isDev && !retrying}
      extra={retrying ? retryingBadge : countBadge}
      actions={retrying ? [] : [
        { label: 'OK', onPress: dismiss, variant: 'primary', icon: '✓' },
      ]}
      isDark={isDark}
    />
  );
};

export default NetworkErrorDialog;
