import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { WA_GREEN, WA_GREEN_DARK, SUPPORT_WHATSAPP_NUMBER } from '../constants';
import { buildShareText, shareToWhatsApp } from '../utils';
import ErrorCard from './ErrorCard';
import type { ErrorState } from '../types';

interface Props {
  error:       ErrorState;
  accentColor: string;
  icon:        string;
  isDark:      boolean;
  onClose:     () => void;
}

const SharePanel: React.FC<Props> = ({ error, accentColor, icon, isDark, onClose }) => {
  const cardRef = useRef<View>(null);
  const [sharingWA,  setSharingWA]  = useState(false);
  const [sharingImg, setSharingImg] = useState(false);

  const busy = sharingWA || sharingImg;

  // ── theme ──────────────────────────────────────────────────────────────────
  const surface   = isDark ? '#1e293b' : '#ffffff';
  const surfaceHi = isDark ? '#273549' : '#f8fafc';
  const border    = isDark ? '#334155' : '#e2e8f0';
  const textPri   = isDark ? '#f1f5f9' : '#0f172a';
  const textSec   = isDark ? '#94a3b8' : '#64748b';

  // ── handlers ───────────────────────────────────────────────────────────────

  const handleWhatsAppShare = async () => {
    if (busy) return;
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
    if (busy) return;
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

      {/* Panel card */}
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
              backgroundColor: pressed
                ? (isDark ? '#334155' : '#e2e8f0')
                : (isDark ? '#1e293b' : '#f1f5f9'),
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

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textPri }}>
              {sharingWA ? 'Opening WhatsApp…' : 'Send to Support'}
            </Text>
            <Text style={{ fontSize: 11, color: textSec, marginTop: 1 }}>
              {SUPPORT_WHATSAPP_NUMBER}
            </Text>
          </View>

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

export default SharePanel;
