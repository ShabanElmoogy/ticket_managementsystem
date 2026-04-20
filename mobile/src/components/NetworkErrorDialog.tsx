import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { networkEvents } from '../services/api/networkEvents';
import { useUiStore } from '../stores/uiStore';

const NetworkErrorDialog: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';

  const [visible, setVisible]   = useState(false);
  const [message, setMessage]   = useState('');
  const [count,   setCount]     = useState(0); // deduplicate rapid errors

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
    return unsub;
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
        onPress={dismiss}
      >
        <Pressable
          onPress={() => {}}
          style={{
            width: '100%', maxWidth: 340,
            borderRadius: 16, overflow: 'hidden',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3, shadowRadius: 20, elevation: 16,
          }}
        >
          {/* Red top stripe */}
          <View style={{ height: 4, backgroundColor: '#ef4444' }} />

          <View style={{ padding: 24 }}>
            {/* Icon + title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 22 }}>📡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                  Connection Error
                </Text>
                <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 1 }}>
                  Network unavailable
                </Text>
              </View>
            </View>

            {/* Message */}
            <Text style={{
              fontSize: 13, lineHeight: 20,
              color: isDark ? '#94a3b8' : '#64748b',
              marginBottom: 20,
            }}>
              {message || 'Unable to reach the server. Please check your internet connection and try again.'}
            </Text>

            {/* Error count badge — shows if multiple errors fired */}
            {count > 1 && (
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
            )}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={dismiss}
                style={({ pressed }) => ({
                  flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
                  backgroundColor: pressed
                    ? (isDark ? '#334155' : '#e2e8f0')
                    : (isDark ? '#273549' : '#f1f5f9'),
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#e2e8f0' : '#374151' }}>
                  Dismiss
                </Text>
              </Pressable>

              <Pressable
                onPress={dismiss}
                style={({ pressed }) => ({
                  flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
                  backgroundColor: pressed ? '#dc2626' : '#ef4444',
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  OK
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default NetworkErrorDialog;
