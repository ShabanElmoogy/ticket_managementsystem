import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { networkEvents } from '@/src/services/api/networkEvents';
import { useUiStore } from '@/src/stores/uiStore';
import { AlertDialog } from '@/src/shared/components';

const NetworkErrorDialog: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [count,   setCount]   = useState(0);

  const dismiss = useCallback(() => {
    setVisible(false);
    setCount(0);
  }, []);

  useEffect(() => {
    const unsub = networkEvents.onError((msg) => {
      setMessage(msg);
      setCount((c) => c + 1);
      setVisible(true);
    });
    return () => { unsub(); };   // wrap so TS sees void, not boolean
  }, []);

  // Count badge — shown when multiple requests failed simultaneously
  const countBadge = count > 1 ? (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: isDark ? '#3b1515' : '#fef2f2',
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
      marginBottom: 16,
    }}>
      <Text style={{ fontSize: 12, color: '#ef4444' }}>
        {count} requests failed
      </Text>
    </View>
  ) : null;

  return (
    <AlertDialog
      visible={visible}
      onClose={dismiss}
      accentColor="#ef4444"
      icon="📡"
      title="Connection Error"
      subtitle="Network unavailable"
      message={message || 'Unable to reach the server. Please check your internet connection and try again.'}
      extra={countBadge}
      actions={[
        { label: 'Dismiss', onPress: dismiss, variant: 'secondary' },
        { label: 'OK',      onPress: dismiss, variant: 'primary'   },
      ]}
      isDark={isDark}
    />
  );
};

export default NetworkErrorDialog;
